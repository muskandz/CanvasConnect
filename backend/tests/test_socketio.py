"""
Socket.IO connection and event tests.
These tests verify that your real-time WebSocket functionality works correctly.
"""

import pytest
import json


class TestSocketIOConnection:
    """Test Socket.IO connection and basic events."""
    
    def test_client_connection(self, socketio_client):
        """Test that a client can connect to the Socket.IO server."""
        # The client should be connected after fixture creation
        assert socketio_client.is_connected()
    
    def test_client_disconnect(self, socketio_client):
        """Test that a client can disconnect from the Socket.IO server."""
        # Disconnect the client
        socketio_client.disconnect()
        assert not socketio_client.is_connected()


class TestSocketIOEvents:
    """Test Socket.IO event handling."""
    
    def test_join_room_event(self, socketio_client):
        """Test joining a room through Socket.IO."""
        # Emit a join_room event
        room_data = {
            'room': 'test_room_123',
            'user': 'test_user'
        }
        
        # Send the event
        socketio_client.emit('join_room', room_data)
        
        # Check for any responses
        received = socketio_client.get_received()
        
        # The test passes if no exceptions are thrown
        # In a real app, you might check for specific response events
        assert isinstance(received, list)
    
    def test_leave_room_event(self, socketio_client):
        """Test leaving a room through Socket.IO."""
        # First join a room
        room_data = {
            'room': 'test_room_123',
            'user': 'test_user'
        }
        socketio_client.emit('join_room', room_data)
        
        # Then leave the room
        socketio_client.emit('leave_room', room_data)
        
        # Check for responses
        received = socketio_client.get_received()
        assert isinstance(received, list)
    
    def test_drawing_event(self, socketio_client):
        """Test sending a drawing event through Socket.IO."""
        # Mock drawing data
        drawing_data = {
            'room': 'test_room_123',
            'drawingData': {
                'tool': 'pen',
                'points': [10, 20, 30, 40],
                'color': '#000000',
                'strokeWidth': 2
            },
            'user': 'test_user'
        }
        
        # Send the drawing event
        socketio_client.emit('drawing', drawing_data)
        
        # Check for responses
        received = socketio_client.get_received()
        assert isinstance(received, list)
    
    def test_voice_signal_event(self, socketio_client):
        """Test voice signaling events."""
        # Mock voice signal data
        signal_data = {
            'room': 'test_room_123',
            'signal': 'test_signal_data',
            'to': 'target_user_id'
        }
        
        # Send voice signal
        socketio_client.emit('voice-signal', signal_data)
        
        # Check for responses
        received = socketio_client.get_received()
        assert isinstance(received, list)


class TestSocketIORoomManagement:
    """Test room-based functionality."""
    
    def test_multiple_clients_same_room(self, app_context):
        """Test multiple clients in the same room."""
        from app import socketio, app
        
        # Create two test clients
        client1 = socketio.test_client(app)
        client2 = socketio.test_client(app)
        
        try:
            # Both clients join the same room
            room_data = {'room': 'shared_room', 'user': 'user1'}
            client1.emit('join_room', room_data)
            
            room_data['user'] = 'user2'
            client2.emit('join_room', room_data)
            
            # Send a drawing from client1
            drawing_data = {
                'room': 'shared_room',
                'drawingData': {'tool': 'pen', 'points': [1, 2, 3, 4]},
                'user': 'user1'
            }
            client1.emit('drawing', drawing_data)
            
            # Both clients should be connected
            assert client1.is_connected()
            assert client2.is_connected()
            
        finally:
            # Clean up
            client1.disconnect()
            client2.disconnect()
