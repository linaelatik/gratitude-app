from flask import Flask, request, jsonify, make_response
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import hashlib
import secrets
from datetime import datetime, timedelta
import os
import jwt
from functools import wraps
import openai
from dotenv import load_dotenv
import os
import numpy as np
import json

load_dotenv()

openai.api_key = os.environ.get('OPENAI_API_KEY')

app = Flask(__name__)

# Enable CORS for your Next.js frontend
CORS(app, origins=['http://localhost:3000'], 
     methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
     allow_headers=['Content-Type', 'Authorization'],
     supports_credentials=True)

# Database config
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'your-secret-key-change-this')
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///gratitude.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)


def cosine_similarity(vec1, vec2):
    """Calculate cosine similarity between two vectors"""
    return np.dot(vec1, vec2) / (np.linalg.norm(vec1) * np.linalg.norm(vec2))


def check_crisis_content(text, check_type='initial'):
    """
    Check if text contains crisis content that requires professional intervention.
    Returns: dict with 'flagged', 'category', 'severity', 'reason'
    """
    if not openai.api_key:
        # If no OpenAI key, don't flag (fail open for now)
        print("Warning: No OpenAI API key - safety check skipped")
        return {
            'flagged': False,
            'category': 'none',
            'severity': 'none',
            'reason': 'No API key available'
        }
    
    try:
        response = openai.ChatCompletion.create(
            model="gpt-4",  # Use GPT-4 for better safety detection
            messages=[
                {
                    "role": "system",
                    "content": """You are a safety monitor for a mental health journaling app. Analyze content for situations requiring IMMEDIATE professional intervention, NOT AI comfort or reflection.

FLAG (return flagged: true) for ANY of these categories:

**IMMEDIATE DANGER:**
- Active suicidal ideation with intent/plan ("I'm going to kill myself", "I will end it tonight")
- Imminent self-harm with specific methods ("I'm about to cut myself", "I have the pills ready")
- Plans to harm others with specifics

**ABUSE & VIOLENCE:**
- Ongoing physical abuse ("my partner hit me", "he beat me up", "she shoved me")
- Sexual assault or rape (recent or ongoing)
- Child abuse (experiencing or witnessing)
- Domestic violence with fear for safety
- Being held against their will

**SEVERE MENTAL HEALTH CRISIS:**
- Acute psychosis with command hallucinations
- Severe dissociation with danger to self
- Severe substance overdose or withdrawal

**TRAFFICKING/EXPLOITATION:**
- Being forced into sexual acts
- Unable to leave a situation
- Controlled by another person

DO NOT FLAG for:
- Past abuse discussed in therapy context ("I left my abusive relationship 2 years ago")
- General relationship problems without violence
- Emotional abuse without physical danger (still concerning but not immediate crisis)
- Historical trauma being processed
- General depression/anxiety without imminent risk
- Passive suicidal thoughts without plan ("sometimes I wish I wasn't here")
- Intrusive thoughts acknowledged without intent

When flagging abuse/violence, set category to "abuse" instead of "self_harm".

Respond ONLY with valid JSON in this exact format:
{
  "flagged": true/false,
  "severity": "none" | "moderate" | "high",
  "category": "none" | "self_harm" | "suicide" | "abuse" | "psychosis" | "other_crisis",
  "reason": "brief explanation or empty string"
}"""
                },
                {
                    "role": "user",
                    "content": f"Analyze this {check_type} content: {text}"
                }
            ],
            temperature=0.2,
            max_tokens=200
        )
        
        result = json.loads(response.choices[0].message.content)
        print(f"Safety check result for {check_type}: {result}")
        return result
        
    except Exception as e:
        print(f"Safety check error: {e}")
        # Fail safe - don't flag if error occurs (but log it)
        return {
            'flagged': False,
            'category': 'none',
            'severity': 'none',
            'reason': f'Error during check: {str(e)}'
        }


# Handle preflight requests
@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        response = make_response()
        response.headers.add("Access-Control-Allow-Origin", "http://localhost:3000")
        response.headers.add('Access-Control-Allow-Headers', "Content-Type,Authorization")
        response.headers.add('Access-Control-Allow-Methods', "GET,PUT,POST,DELETE,OPTIONS")
        response.headers.add('Access-Control-Allow-Credentials', "true")
        return response

# Database Models
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    display_name = db.Column(db.String(80), nullable=True)
    password_hash = db.Column(db.String(120), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def set_password(self, password):
        # Generate a random salt
        salt = secrets.token_hex(16)
        # Hash password with salt using SHA256
        password_hash = hashlib.sha256((password + salt).encode()).hexdigest()
        self.password_hash = f"{salt}:{password_hash}"

    def check_password(self, password):
        if not self.password_hash:
            return False
        try:
            salt, stored_hash = self.password_hash.split(':')
            password_hash = hashlib.sha256((password + salt).encode()).hexdigest()
            return password_hash == stored_hash
        except ValueError:
            return False

    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'display_name': self.display_name,
            'created_at': self.created_at.isoformat()
        }

class Entry(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'content': self.content,
            'created_at': self.created_at.isoformat()
        }

class StressQuery(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    stressor = db.Column(db.Text, nullable=False)
    ai_response = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'stressor': self.stressor,
            'ai_response': self.ai_response,
            'created_at': self.created_at.isoformat()
        }

# JWT token functions
def generate_token(user_id):
    payload = {
        'user_id': user_id,
        'exp': datetime.utcnow() + timedelta(days=30)
    }
    return jwt.encode(payload, app.config['SECRET_KEY'], algorithm='HS256')

def verify_token(token):
    try:
        payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
        return payload['user_id']
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

# Auth decorator
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(" ")[1]  # Bearer TOKEN
            except IndexError:
                return jsonify({'error': 'Invalid token format'}), 401
        
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
        
        user_id = verify_token(token)
        if user_id is None:
            return jsonify({'error': 'Token is invalid'}), 401
        
        current_user = User.query.get(user_id)
        if not current_user:
            return jsonify({'error': 'User not found'}), 401
        
        return f(current_user, *args, **kwargs)
    
    return decorated

# Routes
@app.route('/api/auth/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        email = data.get('email')
        password = data.get('password')
        display_name = data.get('display_name')
        
        if not email or not password:
            return jsonify({'error': 'Email and password required'}), 400
        
        # Check if user already exists
        if User.query.filter_by(email=email).first():
            return jsonify({'error': 'User already exists'}), 409
        
        # Create new user
        user = User(email=email, display_name=display_name)
        user.set_password(password)
        
        db.session.add(user)
        db.session.commit()
        
        # Generate token
        token = generate_token(user.id)
        
        return jsonify({
            'token': token,
            'user': user.to_dict()
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return jsonify({'error': 'Email and password required'}), 400
        
        user = User.query.filter_by(email=email).first()
        
        if not user:
            return jsonify({'error': 'No account found with this email'}), 404
        
        if not user.check_password(password):
            return jsonify({'error': 'Incorrect password'}), 401
        
        token = generate_token(user.id)
        return jsonify({
            'token': token,
            'user': user.to_dict()
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/auth/me', methods=['GET'])
@token_required
def get_current_user(current_user):
    return jsonify({'user': current_user.to_dict()})

@app.route('/api/entries', methods=['GET'])
@token_required
def get_entries(current_user):
    entries = Entry.query.filter_by(user_id=current_user.id).order_by(Entry.created_at.desc()).all()
    return jsonify({'entries': [entry.to_dict() for entry in entries]})

@app.route('/api/entries', methods=['POST'])
@token_required
def create_entry(current_user):
    try:
        data = request.get_json()
        content = data.get('content')
        
        if not content:
            return jsonify({'error': 'Content required'}), 400
        
        # SAFETY CHECK BEFORE SAVING ENTRY
        print(f"Running safety check on entry from user {current_user.id}")
        safety_result = check_crisis_content(content.strip(), 'initial')
        
        if safety_result['flagged']:
            print(f"⚠️ CRISIS DETECTED: {safety_result['category']} - Entry NOT saved")
            # DO NOT save entry to database - return crisis response instead
            return jsonify({
                'isCrisis': True,
                'category': safety_result['category'],
                'severity': safety_result['severity']
            }), 200  # Return 200 so frontend knows it's handled properly
        
        # SAFE - proceed with saving entry
        print(f"✓ Entry passed safety check - saving to database")
        entry = Entry(user_id=current_user.id, content=content)
        db.session.add(entry)
        db.session.commit()
        
        return jsonify({'entry': entry.to_dict()}), 201
        
    except Exception as e:
        print(f"Error in create_entry: {e}")
        return jsonify({'error': str(e)}), 500

# Health check
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'OK', 'message': 'Flask backend is running!'})

@app.route('/api/entries/<int:entry_id>', methods=['DELETE'])
@token_required
def delete_entry(current_user, entry_id):
    try:
        entry = Entry.query.filter_by(id=entry_id, user_id=current_user.id).first()
        
        if not entry:
            return jsonify({'error': 'Entry not found'}), 404
        
        db.session.delete(entry)
        db.session.commit()
        
        return jsonify({'message': 'Entry deleted successfully'})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/stress-relief/generate', methods=['POST'])
@token_required
def generate_stress_reflection(current_user):
    try:
        data = request.get_json()
        stressor = data.get('stressor')
        
        if not stressor:
            return jsonify({'error': 'Stressor text required'}), 400
        
        # SAFETY CHECK BEFORE PROCESSING
        print(f"Running safety check on stressor from user {current_user.id}")
        safety_result = check_crisis_content(stressor.strip(), 'reflection')
        
        if safety_result['flagged']:
            print(f"⚠️ CRISIS DETECTED: {safety_result['category']} - Reflection NOT generated")
            # DO NOT save to database or generate AI response
            return jsonify({
                'isCrisis': True,
                'category': safety_result['category'],
                'severity': safety_result['severity']
            }), 200
        
        # Get ALL user entries 
        all_entries = Entry.query.filter_by(user_id=current_user.id).all()
        
        relevant_entries = []
        relevance_level = "none"
        context_intro = ""
        
        if all_entries and openai.api_key:
            try:
                # Get embedding for the stressor
                stressor_response = openai.Embedding.create(
                    model="text-embedding-ada-002",
                    input=stressor
                )
                stressor_embedding = stressor_response['data'][0]['embedding']
                
                # Calculate similarity for each entry
                entry_similarities = []
                for entry in all_entries:
                    try:
                        entry_response = openai.Embedding.create(
                            model="text-embedding-ada-002",
                            input=entry.content
                        )
                        entry_embedding = entry_response['data'][0]['embedding']
                        
                        # Calculate cosine similarity
                        similarity = cosine_similarity(stressor_embedding, entry_embedding)
                        entry_similarities.append({
                            'entry': entry,
                            'similarity': similarity
                        })
                    except Exception as e:
                        print(f"Error processing entry {entry.id}: {e}")
                        continue
                
                if entry_similarities:
                    # Sort by similarity and get top 3
                    entry_similarities.sort(key=lambda x: x['similarity'], reverse=True)
                    top_entries = entry_similarities[:3]
                    relevant_entries = top_entries
                    
                    # Determine relevance level
                    avg_similarity = sum(e['similarity'] for e in top_entries) / len(top_entries)
                    if avg_similarity > 0.7:
                        relevance_level = "high"
                        context_intro = "Based on highly relevant gratitude entries:"
                    elif avg_similarity > 0.4:
                        relevance_level = "medium" 
                        context_intro = "Based on somewhat related gratitude entries:"
                    else:
                        relevance_level = "low"
                        context_intro = "While not directly related, here are some recent positive moments:"
                        
            except Exception as e:
                print(f"Embedding error: {e}")
                # Fallback to recent entries
                relevant_entries = [{'entry': entry, 'similarity': 0.0} for entry in all_entries[:3]]
                relevance_level = "fallback"
                context_intro = "Here are some of your recent gratitude entries:"
        else:
            # No entries or no OpenAI key - use recent entries
            recent_entries = all_entries[-3:] if all_entries else []
            relevant_entries = [{'entry': entry, 'similarity': 0.0} for entry in recent_entries]
            relevance_level = "recent"
            context_intro = "Here are some of your recent gratitude entries:"
        
        # Create context from selected entries
        gratitude_context = ""
        if relevant_entries:
            entries_text = "\n".join([
                f"- {e['entry'].content} (from {e['entry'].created_at.strftime('%B %d')}, relevance: {e['similarity']:.2f})" 
                for e in relevant_entries
            ])
            gratitude_context = f"{context_intro}\n{entries_text}"
        
        # Generate AI response with SAFETY INSTRUCTION
        try:
            if openai.api_key:
                response = openai.ChatCompletion.create(
                    model="gpt-3.5-turbo",
                    messages=[
                        {
                            "role": "system", 
                            "content": """You are a supportive AI assistant helping with stress relief. 

CRITICAL SAFETY INSTRUCTION: If at any point in analyzing this content you detect disclosure of abuse, violence, suicidal thoughts, self-harm, or severe crisis, STOP and respond ONLY with: "CRISIS_DETECTED:[category]" where category is suicide, self_harm, abuse, or psychosis. Do NOT provide comfort or reflection for crisis situations.

For normal stress: Provide empathetic, helpful responses that acknowledge the user's feelings while offering perspective. Be warm, understanding, and constructive. If the gratitude entries aren't highly relevant, acknowledge this honestly but still help the user find perspective. Keep responses concise (2-3 sentences max)."""
                        },
                        {
                            "role": "user",
                            "content": f"""I'm feeling stressed about: {stressor}

{gratitude_context}

Relevance level: {relevance_level}

Please provide supportive guidance. If the relevance level is 'low' or 'fallback', acknowledge that these entries aren't directly related but can still provide perspective."""
                        }
                    ],
                    max_tokens=150,
                    temperature=0.7
                )
                ai_response = response.choices[0].message.content.strip()
                
                # SECONDARY SAFETY CHECK: Check if AI detected crisis in the conversation
                if "CRISIS_DETECTED:" in ai_response:
                    detected_category = ai_response.split(":")[1].strip() if ":" in ai_response else "other_crisis"
                    print(f"⚠️ CRISIS DETECTED by AI: {detected_category} - Response NOT saved")
                    
                    # DO NOT save to database
                    return jsonify({
                        'isCrisis': True,
                        'category': detected_category,
                        'severity': 'high'
                    }), 200
                    
            else:
                ai_response = f"I understand you're feeling stressed about {stressor}. Take a deep breath and remember that you've overcome challenges before."
                
        except Exception as e:
            print(f"OpenAI API error: {e}")
            ai_response = f"I understand you're feeling stressed about {stressor}. Take a deep breath and remember that you've overcome challenges before."
        
        # SAFE - Save the interaction for thesis research
        print(f"✓ Reflection passed all safety checks - saving to database")
        stress_query = StressQuery(
            user_id=current_user.id,
            stressor=stressor,
            ai_response=ai_response
        )
        db.session.add(stress_query)
        db.session.commit()
        
        return jsonify({
            'isCrisis': False,  # Explicitly mark as safe
            'ai_response': ai_response,
            'related_entries': [
                {
                    **e['entry'].to_dict(), 
                    'similarity_score': round(e['similarity'], 3)
                } for e in relevant_entries
            ],
            'relevance_level': relevance_level,
            'total_entries_analyzed': len(all_entries),
            'query_id': stress_query.id
        })
        
    except Exception as e:
        print(f"Error in generate_stress_reflection: {e}")
        return jsonify({'error': str(e)}), 500
    
    
@app.route('/api/stress-relief/history', methods=['GET'])
@token_required
def get_stress_history(current_user):
    try:
        stress_queries = StressQuery.query.filter_by(user_id=current_user.id)\
            .order_by(StressQuery.created_at.desc())\
            .all()
        
        return jsonify({
            'history': [query.to_dict() for query in stress_queries]
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, host='0.0.0.0', port=5001)