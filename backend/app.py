from flask import Flask
from flask_cors import CORS
from flask_socketio import SocketIO, join_room, leave_room, emit
import eventlet

# Patch the standard library to use eventlet's green versions
eventlet.monkey_patch()

from routes.boards import boards

app = Flask(__name__)

socketio = SocketIO(app, cors_allowed_origins="*", async_mode='eventlet')

# Enable CORS to allow frontend (on different port) to communicate with backend
CORS(app, resources={r"/api/*": {"origins": "http://localhost:5173"}})

# Register Blueprints
app.register_blueprint(boards)

@socketio.on('connect')
def handle_connect():
    print('Client connected')

@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')

@socketio.on('join')
def handle_join(data):
    room = data.get('room')
    join_room(room)
    print(f"User joined room: {room}")
    emit('user_joined', {'room': room}, room=room)

    # Fetch current board state and send to the newly joined user only
    from models.board_model import get_board_data
    board_data = get_board_data(room)
    emit('load_board_state', board_data, room=request.sid)

@socketio.on('leave')
def handle_leave(data):
    room = data.get('room')
    leave_room(room)
    print(f"User left room: {room}")
    emit('user_left', {'room': room}, room=room)

@socketio.on('drawing')
def handle_drawing(data):
    room = data.get('room')
    emit('drawing', data, room=room, include_self=False)

@socketio.on('note_added')
def handle_note_added(data):
    emit('note_added', data, room=data['room'], include_self=False)

@socketio.on('note_updated')
def handle_note_updated(data):
    emit('note_updated', data, room=data['room'], include_self=False)

# Run the Flask app
if __name__ == "__main__":
    socketio.run(app, debug=True, port=5000)