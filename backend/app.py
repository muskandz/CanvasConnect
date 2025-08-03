# Import and patch eventlet first, before any other imports
import eventlet
eventlet.monkey_patch()

import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, join_room, leave_room, emit
from datetime import datetime, timezone

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

from routes.boards import boards

app = Flask(__name__)

# Configuration
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')

# CORS origins from environment or defaults
cors_origins = os.environ.get('CORS_ORIGINS', 'http://localhost:5173,http://localhost:3000,http://localhost:5000,https://canvas-connect-eight.vercel.app').split(',')

print(f"🔧 Starting CanvasConnect Backend...")
print(f"🔑 Secret Key: {'SET' if os.environ.get('SECRET_KEY') else 'DEFAULT'}")
print(f"🌐 CORS Origins: {cors_origins}")
print(f"🗄️  MongoDB URI: {'SET' if os.environ.get('MONGO_URI') else 'NOT SET'}")

socketio = SocketIO(
    app, 
    cors_allowed_origins=cors_origins, 
    async_mode='eventlet',
    transports=['websocket', 'polling'],
    allow_upgrades=True,
    ping_timeout=60,
    ping_interval=25
)

# Enable CORS to allow frontend (on different port) to communicate with backend
CORS(app, resources={r"/api/*": {"origins": cors_origins}})

# Health check endpoint
@app.route('/api/health', methods=['GET'])
def health_check():
    try:
        # Test database connection safely
        from db import test_mongodb_connection
        is_connected, db_message = test_mongodb_connection()
        db_status = "connected" if is_connected else f"error: {db_message}"
    except Exception as e:
        db_status = f"error: {str(e)}"
    
    return jsonify({
        'status': 'healthy', 
        'server': 'app.py', 
        'database': db_status,
        'timestamp': datetime.now(timezone.utc).isoformat()
    })

# Activity endpoint
@app.route('/api/activity/user/<userId>', methods=['GET'])
def get_user_activity(userId):
    # Mock activity data
    activities = [
        {
            'id': 1,
            'type': 'board_created',
            'message': 'Created a new whiteboard',
            'createdAt': datetime.now(timezone.utc).isoformat(),
            'boardId': '1'
        },
        {
            'id': 2,
            'type': 'board_shared',
            'message': 'Shared a board with team',
            'createdAt': datetime.now(timezone.utc).isoformat(),
            'boardId': '2'
        }
    ]
    return jsonify(activities)

# Register Blueprints
app.register_blueprint(boards)

@socketio.on('connect')
def handle_connect():
    print(f'Client connected: {request.sid}')

@socketio.on('disconnect')
def handle_disconnect():
    print(f'Client disconnected: {request.sid}')

@socketio.on('join')
def handle_join(data):
    room = data.get('room')
    join_room(room)
    print(f"User {request.sid} joined room: {room}")
    # Notify others in the room that a new user has joined
    emit('user_joined', {'room': room, 'userId': request.sid}, room=room, include_self=False)

@socketio.on('leave')
def handle_leave(data):
    room = data.get('room')
    leave_room(room)
    print(f"User {request.sid} left room: {room}")
    emit('user_left', {'room': room, 'userId': request.sid}, room=room)

@socketio.on('drawing')
def handle_drawing(data):
    room = data.get('room')
    emit('drawing', data, room=room, include_self=False)

# WebRTC Voice Chat Signaling
@socketio.on('voice-join')
def handle_voice_join(data):
    room = data.get('room')
    join_room(f"voice-{room}")
    print(f"User {request.sid} joined voice room: {room}")
    
    # Notify others in the voice room
    emit('user-joined', {'userId': request.sid}, room=f"voice-{room}", include_self=False)

@socketio.on('voice-leave')
def handle_voice_leave(data):
    room = data.get('room')
    leave_room(f"voice-{room}")
    print(f"User {request.sid} left voice room: {room}")
    emit('user-left', {'userId': request.sid}, room=f"voice-{room}")

@socketio.on('voice-offer')
def handle_voice_offer(data):
    target_id = data.get('targetUserId')
    room = data.get('room')
    if not target_id:
        return
        
    print(f"Forwarding voice offer from {request.sid} to {target_id}")
    data['userId'] = request.sid
    emit('voice-offer', data, room=target_id)

@socketio.on('voice-answer')
def handle_voice_answer(data):
    target_id = data.get('targetUserId')
    room = data.get('room')
    if not target_id:
        return
        
    print(f"Forwarding voice answer from {request.sid} to {target_id}")
    data['userId'] = request.sid
    emit('voice-answer', data, room=target_id)

@socketio.on('ice-candidate')
def handle_ice_candidate(data):
    target_id = data.get('targetUserId')
    room = data.get('room')
    if not target_id:
        return
        
    print(f"Forwarding ICE candidate from {request.sid} to {target_id}")
    data['userId'] = request.sid
    emit('ice-candidate', data, room=target_id)

# Run the Flask app
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    debug = os.environ.get("FLASK_ENV") == "development"
    
    print("Starting CanvasConnect Backend Server...")
    print(f"Server will be available at: http://0.0.0.0:{port}")
    print(f"Environment: {'DEVELOPMENT' if debug else 'PRODUCTION'}")
    print(f"CORS Origins: {', '.join(cors_origins)}")
    
    if debug:
        print("API endpoints:")
        print("   - GET  /api/health")
        print("   - POST /api/boards")
        print("   - GET  /api/boards/user/<userId>")
        print("   - GET  /api/boards/<boardId>")
        print("   - PUT  /api/boards/update")
        print("   - DELETE /api/boards/<boardId>")
        print("   - GET  /api/activity/user/<userId>")
        print("🔌 Socket.IO enabled for real-time collaboration")
    
    socketio.run(app, debug=debug, host="0.0.0.0", port=port)