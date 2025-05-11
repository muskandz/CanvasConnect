# Import and patch eventlet first, before any other imports
import eventlet
eventlet.monkey_patch()

from flask import Flask, request
from flask_cors import CORS
from flask_socketio import SocketIO, join_room, leave_room, emit

from routes.boards import boards

app = Flask(__name__)

socketio = SocketIO(app, cors_allowed_origins="*", async_mode='eventlet')

# Enable CORS to allow frontend (on different port) to communicate with backend
CORS(app, resources={r"/api/*": {"origins": "http://localhost:5173"}})

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
    if not room:
        return
        
    join_room(f"voice-{room}")
    print(f"User {request.sid} joined voice room: {room}")
    
    # Notify others that a new user has joined for voice chat
    emit('user-joined', {'userId': request.sid}, room=f"voice-{room}", include_self=False)

@socketio.on('voice-leave')
def handle_voice_leave(data):
    room = data.get('room')
    if not room:
        return
        
    leave_room(f"voice-{room}")
    print(f"User {request.sid} left voice room: {room}")
    emit('user-left', {'userId': request.sid}, room=f"voice-{room}")

@socketio.on('voice-offer')
def handle_voice_offer(data):
    target_id = data.get('targetUserId')
    if not target_id:
        return
        
    print(f"Forwarding voice offer from {request.sid} to {target_id}")
    data['userId'] = request.sid
    emit('voice-offer', data, room=target_id)

@socketio.on('voice-answer')
def handle_voice_answer(data):
    target_id = data.get('targetUserId')
    if not target_id:
        return
        
    print(f"Forwarding voice answer from {request.sid} to {target_id}")
    data['userId'] = request.sid
    emit('voice-answer', data, room=target_id)

@socketio.on('ice-candidate')
def handle_ice_candidate(data):
    target_id = data.get('targetUserId')
    if not target_id:
        return
        
    print(f"Forwarding ICE candidate from {request.sid} to {target_id}")
    data['userId'] = request.sid
    emit('ice-candidate', data, room=target_id)

# Run the Flask app
if __name__ == "__main__":
    socketio.run(app, debug=True, port=5000)