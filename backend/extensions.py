from flask_sqlalchemy import SQLAlchemy

# db is initialized here and bound to the app in app.py via db.init_app(app).
# All other modules import db from here to avoid circular imports.
db = SQLAlchemy()