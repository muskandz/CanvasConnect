from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit
from datetime import datetime
import json

app = Flask(__name__)

# Enable CORS to allow frontend to communicate with backend
CORS(app, resources={r"/api/*": {"origins": ["http://localhost:5173", "http://localhost:3000"]}})

# Add SocketIO support
socketio = SocketIO(app, cors_allowed_origins=["http://localhost:5173", "http://localhost:3000"])

# Health check endpoint
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'server': 'simple_app.py', 'timestamp': datetime.utcnow().isoformat()})

# In-memory storage for demo purposes
boards_storage = []
board_counter = 1

@app.route('/api/boards', methods=['POST'])
def create_board():
    global board_counter
    data = request.json
    
    board = {
        'id': str(board_counter),
        'userId': data.get('userId'),
        'title': data.get('title', 'Untitled'),
        'description': data.get('description', ''),
        'type': data.get('type', 'whiteboard'),
        'templateType': data.get('templateType', 'whiteboard'),
        'background': data.get('background', '#ffffff'),
        'createdAt': datetime.utcnow().isoformat(),
        'updatedAt': datetime.utcnow().isoformat(),
        'data': data.get('data', ''),
        'notes': data.get('notes', []),
        'textBoxes': data.get('textBoxes', []),
        'isPublic': data.get('isPublic', False)
    }
    
    boards_storage.append(board)
    board_counter += 1
    
    return jsonify(board), 201

@app.route('/api/boards/user/<userId>', methods=['GET'])
def get_user_boards(userId):
    user_boards = [board for board in boards_storage if board['userId'] == userId]
    return jsonify(user_boards)

@app.route('/api/boards/<boardId>', methods=['GET'])
def get_board(boardId):
    board = next((b for b in boards_storage if b['id'] == boardId), None)
    if not board:
        return jsonify({'error': 'Board not found'}), 404
    return jsonify(board)

@app.route('/api/boards/<boardId>', methods=['DELETE'])
def delete_board(boardId):
    global boards_storage
    boards_storage = [b for b in boards_storage if b['id'] != boardId]
    return jsonify({'message': 'Board deleted successfully'})

@app.route('/api/boards/<boardId>', methods=['PUT'])
def update_board(boardId):
    board = next((b for b in boards_storage if b['id'] == boardId), None)
    if not board:
        return jsonify({'error': 'Board not found'}), 404
    
    print('Boards Storage:', boards_storage)
    print('Incoming boardId:', boardId)
    
    data = request.json
    board.update({
        'title': data.get('title', board['title']),
        'description': data.get('description', board['description']),
        'data': data.get('data', board['data']),
        'notes': data.get('notes', board.get('notes', [])),
        'textBoxes': data.get('textBoxes', board.get('textBoxes', [])),
        'background': data.get('background', board.get('background', '#ffffff')),
        'templateType': data.get('templateType', board.get('templateType', 'whiteboard')),
        'updatedAt': datetime.utcnow().isoformat()
    })
    
    return jsonify(board)

# Add the update route that matches frontend calls
@app.route('/api/boards/update', methods=['PUT'])
def update_board_alt():
    data = request.json
    board_id = data.get('boardId')
    
    if not board_id:
        return jsonify({'error': 'boardId is required'}), 400
    
    board = next((b for b in boards_storage if b['id'] == board_id), None)
    if not board:
        return jsonify({'error': 'Board not found'}), 404
    
    print(f'Updating board {board_id} with textBoxes:', data.get('textBoxes', []))
    
    # Update all fields
    if 'data' in data:
        board['data'] = data['data']
    if 'notes' in data:
        board['notes'] = data['notes']
    if 'textBoxes' in data:
        board['textBoxes'] = data['textBoxes']
    if 'title' in data:
        board['title'] = data['title']
    if 'background' in data:
        board['background'] = data['background']
    if 'templateType' in data:
        board['templateType'] = data['templateType']
    
    board['updatedAt'] = datetime.utcnow().isoformat()
    
    print(f'Board after update:', board)
    return jsonify({'message': 'Board updated successfully'})

@app.route('/api/activity/user/<userId>', methods=['GET'])
def get_user_activity(userId):
    # Mock activity data
    activities = [
        {
            'id': 1,
            'type': 'board_created',
            'message': 'Created a new whiteboard',
            'createdAt': datetime.utcnow().isoformat(),
            'boardId': '1'
        },
        {
            'id': 2,
            'type': 'board_shared',
            'message': 'Shared a board with team',
            'createdAt': datetime.utcnow().isoformat(),
            'boardId': '2'
        }
    ]
    return jsonify(activities)

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'timestamp': datetime.utcnow().isoformat()})

@socketio.on('connect')
def handle_connect():
    print(f'Client connected: {request.sid}')

@socketio.on('disconnect') 
def handle_disconnect():
    print(f'Client disconnected: {request.sid}')

if __name__ == '__main__':
    print("🚀 Starting CanvasConnect Backend Server...")
    print("📍 Server will be available at: http://localhost:5002")
    print("🔧 API endpoints:")
    print("   - GET  /api/health")
    print("   - POST /api/boards")
    print("   - GET  /api/boards/user/<userId>")
    print("   - GET  /api/boards/<boardId>")
    print("   - PUT  /api/boards/<boardId>")
    print("   - DELETE /api/boards/<boardId>")
    print("   - GET  /api/activity/user/<userId>")
    print("🔌 Socket.IO enabled for real-time collaboration")
    
    socketio.run(app, debug=True, port=5002, host='0.0.0.0')
