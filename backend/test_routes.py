"""
Quick test endpoint to verify deployment
"""
from flask import Blueprint, jsonify
from datetime import datetime, timezone

test = Blueprint('test', __name__, url_prefix='/api')

@test.route("/test", methods=["GET"])
def test_endpoint():
    return jsonify({
        "status": "success",
        "message": "New deployment is live!",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version": "mock-data-enabled"
    })

@test.route("/test/board", methods=["POST"])
def test_board_creation():
    return jsonify({
        "status": "success",
        "message": "Board creation test successful",
        "id": "test-board-123",
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
