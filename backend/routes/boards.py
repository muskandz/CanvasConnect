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
    try:
        if boards_collection is None:
            print("⚠️ Database not available - returning mock success")
            data = request.json
            return jsonify({
                "id": "mock-board-" + str(hash(data.get('title', 'untitled'))),
                "title": data.get('title', 'Untitled'),
                "type": data.get('type', 'whiteboard'),
                "userId": data.get('userId'),
                "message": "Board created successfully (mock data - database connection needed for persistence)",
                "status": "success_mock"
            }), 201
            
        print(f"Creating board - Request received at {datetime.utcnow()}")
        data = request.json
        print(f"Board data: {data.get('title', 'Untitled')} - Type: {data.get('type', 'whiteboard')}")
        
        board = {
            "userId": data["userId"],
            "title": data.get("title", "Untitled"),
            "description": data.get("description", ""),
            "type": data.get("type", "whiteboard"),
            "templateType": data.get("templateType", "whiteboard"),
            "background": data.get("background", "#ffffff"),
            "isPublic": data.get("isPublic", False),
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow(),
            "data": data.get("data", ""),  # optional board content
            "notes": data.get("notes", []),  # optional notes
            "textBoxes": data.get("textBoxes", []),  # ✅ Add textBoxes support
            "ownerId": data["userId"]  # Add ownerId for compatibility
        }
        
        print("Inserting board into database...")
        result = boards_collection.insert_one(board)
        board["_id"] = result.inserted_id
        print(f"Board created successfully with ID: {result.inserted_id}")
        
        return jsonify(board_to_dict(board)), 201
        
    except Exception as e:
        print(f"Error creating board: {str(e)}")
        return jsonify({"error": "Failed to create board", "details": str(e)}), 500

# Get all boards for a user
@boards.route("/boards/user/<userId>", methods=["GET"])
def get_boards(userId):
    try:
        if boards_collection is None:
            print("⚠️ Database not available - returning mock boards")
            # Return mock boards so the frontend can function
            mock_boards = [
                {
                    "id": "mock-board-1",
                    "title": "Welcome to CanvasConnect!",
                    "description": "This is a mock board. Set up MongoDB to save real boards.",
                    "type": "whiteboard",
                    "templateType": "whiteboard",
                    "background": "#ffffff",
                    "isPublic": False,
                    "createdAt": datetime.utcnow().isoformat(),
                    "updatedAt": datetime.utcnow().isoformat(),
                    "userId": userId,
                    "ownerId": userId
                },
                {
                    "id": "mock-board-2", 
                    "title": "Sample Kanban Board",
                    "description": "Demo board showing kanban features",
                    "type": "kanban",
                    "templateType": "kanban",
                    "background": "#f0f8ff",
                    "isPublic": False,
                    "createdAt": datetime.utcnow().isoformat(),
                    "updatedAt": datetime.utcnow().isoformat(),
                    "userId": userId,
                    "ownerId": userId
                }
            ]
            return jsonify(mock_boards)
            
        print(f"Getting boards for user: {userId}")
        user_boards = boards_collection.find({"userId": userId})
        boards_list = [board_to_dict(b) for b in user_boards]
        print(f"Found {len(boards_list)} boards for user {userId}")
        return jsonify(boards_list)
        
    except Exception as e:
        print(f"Error getting boards for user {userId}: {str(e)}")
        return jsonify({"error": "Failed to get boards", "details": str(e)}), 500

# Delete a board
@boards.route("/boards/<boardId>", methods=["DELETE"])
def delete_board(boardId):
    try:
        if boards_collection is None:
            return jsonify({"error": "Database connection not available"}), 503
            
        boards_collection.delete_one({"_id": ObjectId(boardId)})
        return jsonify({"message": "Deleted"}), 200
        
    except Exception as e:
        print(f"Error deleting board {boardId}: {str(e)}")
        return jsonify({"error": "Failed to delete board", "details": str(e)}), 500

# Delete all user data (for account deletion)
@boards.route("/user/<userId>/delete-all-data", methods=["DELETE"])
def delete_user_data(userId):
    try:
        # Delete all boards owned by the user
        boards_result = boards_collection.delete_many({"userId": userId})
        
        # Delete all whiteboard data for this user
        whiteboards_result = whiteboards.delete_many({"userId": userId})
        
        # You can add more collections here as needed
        # For example: comments, shared boards, etc.
        
        return jsonify({
            "message": "All user data deleted successfully",
            "deleted_boards": boards_result.deleted_count,
            "deleted_whiteboards": whiteboards_result.deleted_count
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Get saved board
@boards.route("/boards/<boardId>", methods=["GET"])
def get_board(boardId):
    board = boards_collection.find_one({"_id": ObjectId(boardId)})
    if not board:
        return jsonify({'error': 'Board not found'}), 404
    
    print(f"Retrieved board from DB: {board}")
    print(f"TextBoxes in DB: {board.get('textBoxes', 'NOT FOUND')}")
    
    return jsonify(board_to_dict(board)), 200

# Update a board
@boards.route("/boards/update", methods=["PUT"])
def update_board():
    data = request.get_json()
    board_id = data.get('boardId')
    new_data = data.get('data')
    notes = data.get('notes')  # ✅ Get notes from frontend
    text_boxes = data.get('textBoxes')  # ✅ Get textBoxes from frontend
    background = data.get('background')  # Background color
    template_type = data.get('templateType')  # Template type

    print(f"Updating board {board_id}")
    print(f"Received textBoxes: {text_boxes}")
    print(f"Number of textBoxes: {len(text_boxes) if text_boxes else 0}")

    if not board_id or not ObjectId.is_valid(board_id):
        return jsonify({'error': 'Invalid or missing board ID'}), 400

    update_fields = {}
    if new_data is not None:
        update_fields["data"] = new_data
    if "title" in data:
        update_fields["title"] = data["title"]
    if notes is not None:
        update_fields["notes"] = notes
    if text_boxes is not None:  # ✅ Add textBoxes support
        update_fields["textBoxes"] = text_boxes
        print(f"Adding textBoxes to update_fields: {text_boxes}")
    if background is not None:
        update_fields["background"] = background
    if template_type is not None:
        update_fields["templateType"] = template_type
    
    # Always update the updatedAt timestamp
    update_fields["updatedAt"] = datetime.utcnow()

    result = boards_collection.update_one(
        {"_id": ObjectId(board_id)},
        {"$set": update_fields}
    )

    print(f"Database update result - matched: {result.matched_count}, modified: {result.modified_count}")
    print(f"Update fields sent to DB: {update_fields}")

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