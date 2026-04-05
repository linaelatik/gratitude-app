import openai
from flask import Blueprint, jsonify, request

from auth import token_required
from extensions import db
from models import Entry, StressQuery
from safety import check_crisis_content, cosine_similarity

stress_bp = Blueprint('stress', __name__)

# System prompt for the stress relief reflection generator.
# Uses a three-step structure to catch both explicit crisis content
# and subtler context blindness patterns before generating a response.
REFLECTION_SYSTEM_PROMPT = """You are a safety-aware AI assistant for a mental health research app.

STEP 1 - CRISIS CHECK: If the stressor contains direct disclosure of abuse, violence, suicidal thoughts, or self-harm, respond ONLY with: "CRISIS_DETECTED:[category]"

STEP 2 - CONTEXT BLINDNESS CHECK: Read the stressor AND the gratitude entries together as a pattern. Ask:
- Is the stressor framed positively ("staying strong", "pushing through") but describing physical or psychological harm?
- Would a clinical professional look at these entries together and see a concerning pattern the user themselves may not recognize?

If YES to any of the above, you MUST start your response with exactly: (Context Blindness Detected)
Then redirect gently toward professional support. Do NOT validate or reinforce the pattern.

STEP 3 - NORMAL RESPONSE: If no flags, provide a warm, brief (2-3 sentence) supportive reflection."""


def _get_relevant_entries(stressor: str, all_entries: list) -> tuple:
    """
    Find the most semantically relevant journal entries for a given stressor
    using OpenAI embeddings and cosine similarity.

    Falls back to the three most recent entries if embeddings fail or
    no API key is available.

    Returns:
        relevant_entries: List of dicts with 'entry' and 'similarity' keys.
        relevance_level: String label ('high', 'medium', 'low', 'fallback', 'recent').
        context_intro: Human-readable intro line for the AI prompt context.
    """
    if not all_entries or not openai.api_key:
        recent = all_entries[-3:] if all_entries else []
        return (
            [{'entry': e, 'similarity': 0.0} for e in recent],
            'recent',
            'Here are some of your recent gratitude entries:'
        )

    try:
        stressor_embedding = openai.Embedding.create(
            model="text-embedding-ada-002",
            input=stressor
        )['data'][0]['embedding']

        scored = []
        for entry in all_entries:
            try:
                entry_embedding = openai.Embedding.create(
                    model="text-embedding-ada-002",
                    input=entry.content
                )['data'][0]['embedding']

                scored.append({
                    'entry': entry,
                    'similarity': cosine_similarity(stressor_embedding, entry_embedding)
                })
            except Exception as e:
                print(f"Error embedding entry {entry.id}: {e}")

        if not scored:
            raise ValueError("No entries could be embedded")

        top = sorted(scored, key=lambda x: x['similarity'], reverse=True)[:3]
        avg_sim = sum(e['similarity'] for e in top) / len(top)

        if avg_sim > 0.7:
            return top, 'high', 'Based on highly relevant gratitude entries:'
        elif avg_sim > 0.4:
            return top, 'medium', 'Based on somewhat related gratitude entries:'
        else:
            return top, 'low', 'While not directly related, here are some recent positive moments:'

    except Exception as e:
        print(f"Embedding error — falling back to recent entries: {e}")
        fallback = [{'entry': e, 'similarity': 0.0} for e in all_entries[:3]]
        return fallback, 'fallback', 'Here are some of your recent gratitude entries:'


@stress_bp.route('/api/stress-relief/generate', methods=['POST'])
@token_required
def generate_stress_reflection(current_user):
    """
    Generate a safety-aware AI reflection based on a user's stressor
    and their most semantically relevant gratitude journal entries.

    Safety checks run before and after AI generation. Crisis content
    is never saved to the database.
    """
    try:
        data = request.get_json()
        stressor = data.get('stressor')

        if not stressor:
            return jsonify({'error': 'Stressor text required'}), 400

        # Pre-generation safety check
        print(f"Running safety check on stressor from user {current_user.id}")
        safety_result = check_crisis_content(stressor.strip(), 'reflection')

        if safety_result['flagged']:
            print(f"⚠️ CRISIS DETECTED: {safety_result['category']} — reflection NOT generated")
            return jsonify({
                'isCrisis': True,
                'category': safety_result['category'],
                'severity': safety_result['severity']
            }), 200

        all_entries = Entry.query.filter_by(user_id=current_user.id).all()
        relevant_entries, relevance_level, context_intro = _get_relevant_entries(stressor, all_entries)

        # Build context block from selected entries
        gratitude_context = ""
        if relevant_entries:
            lines = "\n".join([
                f"- {e['entry'].content} "
                f"(from {e['entry'].created_at.strftime('%B %d')}, "
                f"relevance: {e['similarity']:.2f})"
                for e in relevant_entries
            ])
            gratitude_context = f"{context_intro}\n{lines}"

        # Generate AI reflection
        try:
            if openai.api_key:
                response = openai.ChatCompletion.create(
                    model="gpt-3.5-turbo",
                    messages=[
                        {"role": "system", "content": REFLECTION_SYSTEM_PROMPT},
                        {"role": "user", "content": (
                            f"I'm feeling stressed about: {stressor}\n\n"
                            f"{gratitude_context}\n\n"
                            f"Relevance level: {relevance_level}\n\n"
                            "Please provide supportive guidance. If the relevance level is "
                            "'low' or 'fallback', acknowledge that these entries aren't directly "
                            "related but can still provide perspective."
                        )}
                    ],
                    max_tokens=150,
                    temperature=0.7
                )
                ai_response = response.choices[0].message.content.strip()

                # Post-generation safety check — catches crisis patterns the AI itself flags
                if "CRISIS_DETECTED:" in ai_response:
                    detected_category = ai_response.split(":")[1].strip() if ":" in ai_response else "other_crisis"
                    print(f"⚠️ CRISIS DETECTED by AI: {detected_category} — response NOT saved")
                    return jsonify({
                        'isCrisis': True,
                        'category': detected_category,
                        'severity': 'high'
                    }), 200

            else:
                ai_response = (
                    f"I understand you're feeling stressed about {stressor}. "
                    "Take a deep breath and remember that you've overcome challenges before."
                )

        except Exception as e:
            print(f"OpenAI API error: {e}")
            ai_response = (
                f"I understand you're feeling stressed about {stressor}. "
                "Take a deep breath and remember that you've overcome challenges before."
            )

        # Save the interaction for research purposes
        print(f"✓ Reflection passed all safety checks — saving to database")
        stress_query = StressQuery(
            user_id=current_user.id,
            stressor=stressor,
            ai_response=ai_response
        )
        db.session.add(stress_query)
        db.session.commit()

        return jsonify({
            'isCrisis': False,
            'ai_response': ai_response,
            'related_entries': [
                {**e['entry'].to_dict(), 'similarity_score': round(e['similarity'], 3)}
                for e in relevant_entries
            ],
            'relevance_level': relevance_level,
            'total_entries_analyzed': len(all_entries),
            'query_id': stress_query.id
        })

    except Exception as e:
        print(f"Error in generate_stress_reflection: {e}")
        return jsonify({'error': str(e)}), 500


@stress_bp.route('/api/stress-relief/history', methods=['GET'])
@token_required
def get_stress_history(current_user):
    """Return all past stress relief interactions for the authenticated user."""
    try:
        queries = (
            StressQuery.query
            .filter_by(user_id=current_user.id)
            .order_by(StressQuery.created_at.desc())
            .all()
        )
        return jsonify({'history': [q.to_dict() for q in queries]})

    except Exception as e:
        return jsonify({'error': str(e)}), 500