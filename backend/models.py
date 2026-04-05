import hashlib
import secrets
from datetime import datetime
from extensions import db


class User(db.Model):
    """Registered user of the application."""

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    display_name = db.Column(db.String(80), nullable=True)
    password_hash = db.Column(db.String(120), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def set_password(self, password: str) -> None:
        """Hash and store a password using SHA256 with a random salt."""
        salt = secrets.token_hex(16)
        hashed = hashlib.sha256((password + salt).encode()).hexdigest()
        self.password_hash = f"{salt}:{hashed}"

    def check_password(self, password: str) -> bool:
        """Return True if the given password matches the stored hash."""
        if not self.password_hash:
            return False
        try:
            salt, stored_hash = self.password_hash.split(':')
            hashed = hashlib.sha256((password + salt).encode()).hexdigest()
            return hashed == stored_hash
        except ValueError:
            return False

    def to_dict(self) -> dict:
        return {
            'id': self.id,
            'email': self.email,
            'display_name': self.display_name,
            'created_at': self.created_at.isoformat()
        }


class Entry(db.Model):
    """A single gratitude journal entry submitted by a user."""

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self) -> dict:
        return {
            'id': self.id,
            'user_id': self.user_id,
            'content': self.content,
            'created_at': self.created_at.isoformat()
        }


class StressQuery(db.Model):
    """Records a stress relief interaction — stressor input and the AI response generated."""

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    stressor = db.Column(db.Text, nullable=False)
    ai_response = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self) -> dict:
        return {
            'id': self.id,
            'user_id': self.user_id,
            'stressor': self.stressor,
            'ai_response': self.ai_response,
            'created_at': self.created_at.isoformat()
        }