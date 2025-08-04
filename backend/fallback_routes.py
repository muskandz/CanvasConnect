"""
Fallback routes for when database is not available
These provide mock data so the frontend can still function
"""

from flask import Blueprint, jsonify
from datetime import datetime, timezone

fallback = Blueprint('fallback', __name__, url_prefix='/api')

@fallback.route("/boards/user/<userId>", methods=["GET"])
def get_boards_fallback(userId):
    """Return mock boards when database is unavailable"""
    mock_boards = [
        {
            "id": "mock-board-1",
            "title": "Welcome Board",
            "description": "This is a mock board - database connection needed for real data",
            "type": "whiteboard",
            "templateType": "whiteboard",
            "background": "#ffffff",
            "isPublic": False,
            "createdAt": datetime.now(timezone.utc).isoformat(),
            "updatedAt": datetime.now(timezone.utc).isoformat(),
            "userId": userId,
            "ownerId": userId
        }
    ]
    return jsonify(mock_boards)

@fallback.route("/boards", methods=["POST"])
def create_board_fallback():
    """Return mock success when database is unavailable"""
    return jsonify({
        "error": "Database connection required",
        "message": "Please check your MongoDB connection string and try again"
    }), 503
