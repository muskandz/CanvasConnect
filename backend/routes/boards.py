from flask import Blueprint, request, jsonify
from bson import ObjectId
from datetime import datetime
from db import boards_collection, whiteboards
from models import board_to_dict

# boards = Blueprint("boards", __name__)
boards = Blueprint('boards', __name__, url_prefix='/api')

# Create a new board
@boards.route("/boards", methods=["POST"])
def create_board():
    data = request.json
    board = {
        "userId": data["userId"],
        "title": data.get("title", "Untitled"),
        "createdAt": datetime.utcnow(),
        "data": data.get("data", "")  # optional board content
    }
    result = boards_collection.insert_one(board)
    board["_id"] = result.inserted_id
    return jsonify(board_to_dict(board)), 201

# Get all boards for a user
@boards.route("/boards/user/<userId>", methods=["GET"])
def get_boards(userId):
    user_boards = boards_collection.find({"userId": userId})
    return jsonify([board_to_dict(b) for b in user_boards])

# Delete a board
@boards.route("/boards/<boardId>", methods=["DELETE"])
def delete_board(boardId):
    boards_collection.delete_one({"_id": ObjectId(boardId)})
    return jsonify({"message": "Deleted"}), 200

# Get saved board
@boards.route("/boards/<boardId>", methods=["GET"])
def get_board(boardId):
    board = boards_collection.find_one({"_id": ObjectId(boardId)})
    if not board:
        return jsonify({'error': 'Board not found'}), 404
    return jsonify(board_to_dict(board)), 200

# Update a board
@boards.route("/boards/update", methods=["PUT"])
def update_board():
    data = request.get_json()
    board_id = data.get('boardId')
    new_data = data.get('data')
    notes = data.get('notes')  # ✅ Get notes from frontend

    if not board_id or not ObjectId.is_valid(board_id):
        return jsonify({'error': 'Invalid or missing board ID'}), 400

    update_fields = {}
    if new_data is not None:
        update_fields["data"] = new_data
    if "title" in data:
        update_fields["title"] = data["title"]
    if notes is not None:
        update_fields["notes"] = notes

    result = boards_collection.update_one(
        {"_id": ObjectId(board_id)},
        {"$set": update_fields}
    )

    if result.matched_count == 0:
        return jsonify({'error': 'Board not found'}), 404
    
    return jsonify({'message': 'Board updated successfully'}), 200
    
@boards.route('/save-shared-board', methods=['POST'])
def save_shared_board():
    data = request.get_json()
    board_id = data.get('boardId')
    board_title = data.get('boardTitle')
    user_email = data.get('userEmail')

    # Check if the board is already saved for this user
    existing = boards_collection.find_one({
        'boardId': board_id,
        'userEmail': user_email
    })

    if not existing:
        # Save board to this user's dashboard
        boards_collection.insert_one({
            'boardId': board_id,
            'boardTitle': board_title or "Shared Board",
            'userEmail': user_email,
            'createdAt': datetime.utcnow()
        })
        return jsonify({'message': 'Board saved successfully'}), 201
    else:
        return jsonify({'message': 'Board already exists'}), 200
    
@boards.route('/whiteboards/<user_id>', methods=['GET'])
def get_whiteboards(user_id):
    owned = list(whiteboards.find({"owner": user_id}))
    shared = list(whiteboards.find({"sharedWith": {"$in": [user_id]}}))
    all_boards = owned + shared
    for board in all_boards:
        board['_id'] = str(board['_id'])
    return jsonify(all_boards)

# POST new board
@boards.route('/whiteboards', methods=['POST'])
def save_whiteboard():
    data = request.json
    whiteboards.insert_one({
        "owner": data["owner"],
        "name": data["name"],
        "data": data["canvasData"],
        "sharedWith": data.get("sharedWith", [])
    })
    return jsonify({"message": "Whiteboard saved successfully"})

# PATCH to share board
@boards.route('/whiteboards/share/<board_id>', methods=['PATCH'])
def share_board(board_id):
    data = request.json  # expects: { "userIdToShare": "xyz@example.com" }
    result = whiteboards.update_one(
        {"_id": ObjectId(board_id)},
        {"$addToSet": {"sharedWith": data["userIdToShare"]}}  # avoid duplicates
    )
    if result.modified_count:
        return jsonify({"message": "Board shared successfully"})
    return jsonify({"message": "Board not found or already shared"}), 404