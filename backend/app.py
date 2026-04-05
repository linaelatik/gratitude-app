import os

import openai
from dotenv import load_dotenv
from flask import Flask, jsonify, make_response, request
from flask_cors import CORS

from extensions import db

load_dotenv()

# Set OpenAI key once at startup so all modules can use openai.api_key.
openai.api_key = os.environ.get('OPENAI_API_KEY')


def create_app() -> Flask:
    """
    Application factory. Creates and configures the Flask app,
    registers all blueprints, and initializes extensions.
    """
    app = Flask(__name__)

    # --- Configuration ---
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'change-this-in-production')
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///gratitude.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    # --- Extensions ---
    db.init_app(app)
    CORS(
        app,
        origins=['http://localhost:3000'],
        methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allow_headers=['Content-Type', 'Authorization'],
        supports_credentials=True
    )

    # --- Blueprints ---
    from auth import auth_bp
    from routes.entries import entries_bp
    from routes.stress import stress_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(entries_bp)
    app.register_blueprint(stress_bp)

    # --- Preflight handler ---
    @app.before_request
    def handle_preflight():
        """Return CORS headers for all OPTIONS preflight requests."""
        if request.method == "OPTIONS":
            response = make_response()
            response.headers.add("Access-Control-Allow-Origin", "http://localhost:3000")
            response.headers.add("Access-Control-Allow-Headers", "Content-Type,Authorization")
            response.headers.add("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS")
            response.headers.add("Access-Control-Allow-Credentials", "true")
            return response

    # --- Health check ---
    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({'status': 'OK', 'message': 'Backend is running'})

    return app


if __name__ == '__main__':
    app = create_app()
    with app.app_context():
        db.create_all()
    app.run(debug=True, host='0.0.0.0', port=5001)