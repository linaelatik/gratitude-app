from datetime import datetime, timedelta
from functools import wraps

import jwt
from flask import Blueprint, current_app, jsonify, request

from extensions import db
from models import User

auth_bp = Blueprint('auth', __name__)


# ---------------------------------------------------------------------------
# JWT helpers
# ---------------------------------------------------------------------------

def generate_token(user_id: int) -> str:
    """Return a signed JWT that expires in 30 days."""
    payload = {
        'user_id': user_id,
        'exp': datetime.utcnow() + timedelta(days=30)
    }
    return jwt.encode(payload, current_app.config['SECRET_KEY'], algorithm='HS256')


def verify_token(token: str) -> "int | None":
    """
    Decode and validate a JWT.

    Returns the user_id on success, or None if the token is expired or invalid.
    """
    try:
        payload = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=['HS256'])
        return payload['user_id']
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        return None


def token_required(f):
    """
    Route decorator that enforces JWT authentication.

    Reads the Bearer token from the Authorization header, validates it,
    and passes the resolved User object as the first argument to the route.
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None

        auth_header = request.headers.get('Authorization')
        if auth_header:
            try:
                token = auth_header.split(" ")[1]  # Expected format: "Bearer <token>"
            except IndexError:
                return jsonify({'error': 'Invalid token format'}), 401

        if not token:
            return jsonify({'error': 'Token is missing'}), 401

        user_id = verify_token(token)
        if user_id is None:
            return jsonify({'error': 'Token is invalid or expired'}), 401

        current_user = User.query.get(user_id)
        if not current_user:
            return jsonify({'error': 'User not found'}), 401

        return f(current_user, *args, **kwargs)

    return decorated


# ---------------------------------------------------------------------------
# Auth routes
# ---------------------------------------------------------------------------

@auth_bp.route('/api/auth/register', methods=['POST'])
def register():
    """Create a new user account and return a JWT."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        email = data.get('email')
        password = data.get('password')
        display_name = data.get('display_name')

        if not email or not password:
            return jsonify({'error': 'Email and password required'}), 400

        if User.query.filter_by(email=email).first():
            return jsonify({'error': 'User already exists'}), 409

        user = User(email=email, display_name=display_name)
        user.set_password(password)
        db.session.add(user)
        db.session.commit()

        return jsonify({
            'token': generate_token(user.id),
            'user': user.to_dict()
        }), 201

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@auth_bp.route('/api/auth/login', methods=['POST'])
def login():
    """Authenticate a user and return a JWT."""
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

        return jsonify({
            'token': generate_token(user.id),
            'user': user.to_dict()
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@auth_bp.route('/api/auth/me', methods=['GET'])
@token_required
def get_current_user(current_user):
    """Return the profile of the currently authenticated user."""
    return jsonify({'user': current_user.to_dict()})