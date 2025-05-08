from flask_socketio import SocketIO, emit, join_room, leave_room

socketio = None  # this will be set from app.py

def init_socketio(app):
    global socketio
    socketio = SocketIO(app, cors_allowed_origins="*")

    @socketio.on("join")
    def handle_join(data):
        room = data["boardId"]
        join_room(room)
        emit("user_joined", {"msg": "A user joined the board."}, room=room)

    @socketio.on("draw")
    def handle_draw(data):
        room = data["boardId"]
        emit("draw", data, room=room, include_self=False)

    @socketio.on("note_update")
    def handle_note_update(data):
        room = data["boardId"]
        emit("note_update", data, room=room, include_self=False)

    @socketio.on("disconnect")
    def handle_disconnect():
        print("A user disconnected")
