from flask import Blueprint, jsonify, request

from auth import token_required
from extensions import db
from models import Entry
from safety import check_crisis_content

entries_bp = Blueprint('entries', __name__)


@entries_bp.route('/api/entries', methods=['GET'])
@token_required
def get_entries(current_user):
    """Return all journal entries for the authenticated user, newest first."""
    entries = (
        Entry.query
        .filter_by(user_id=current_user.id)
        .order_by(Entry.created_at.desc())
        .all()
    )
    return jsonify({'entries': [e.to_dict() for e in entries]})


@entries_bp.route('/api/entries', methods=['POST'])
@token_required
def create_entry(current_user):
    """
    Save a new journal entry after running a crisis safety check.

    If the content is flagged, the entry is NOT saved and a crisis
    response is returned so the frontend can show appropriate resources.
    """
    try:
        data = request.get_json()
        content = data.get('content')

        if not content:
            return jsonify({'error': 'Content required'}), 400

        print(f"Running safety check on entry from user {current_user.id}")
        safety_result = check_crisis_content(content.strip(), 'initial')

        if safety_result['flagged']:
            print(f"⚠️ CRISIS DETECTED: {safety_result['category']} — entry NOT saved")
            # Do not persist flagged content to the database
            return jsonify({
                'isCrisis': True,
                'category': safety_result['category'],
                'severity': safety_result['severity']
            }), 200

        print(f"✓ Entry passed safety check — saving to database")
        entry = Entry(user_id=current_user.id, content=content)
        db.session.add(entry)
        db.session.commit()

        return jsonify({'entry': entry.to_dict()}), 201

    except Exception as e:
        print(f"Error in create_entry: {e}")
        return jsonify({'error': str(e)}), 500


@entries_bp.route('/api/entries/<int:entry_id>', methods=['DELETE'])
@token_required
def delete_entry(current_user, entry_id):
    """Delete a specific journal entry belonging to the authenticated user."""
    try:
        entry = Entry.query.filter_by(id=entry_id, user_id=current_user.id).first()

        if not entry:
            return jsonify({'error': 'Entry not found'}), 404

        db.session.delete(entry)
        db.session.commit()

        return jsonify({'message': 'Entry deleted successfully'})

    except Exception as e:
        return jsonify({'error': str(e)}), 500