"""
Test configuration file for pytest.
This file contains fixtures and configuration for testing the Flask-SocketIO application.
"""

import pytest
import sys
import os

# Add the backend directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import app, socketio


@pytest.fixture
def client():
    """Create a test client for the Flask application."""
    app.config['TESTING'] = True
    app.config['WTF_CSRF_ENABLED'] = False
    
    with app.test_client() as client:
        with app.app_context():
            yield client


@pytest.fixture
def socketio_client():
    """Create a test client for Socket.IO connections."""
    app.config['TESTING'] = True
    
    # Create a Socket.IO test client
    client = socketio.test_client(app)
    yield client
    # Only disconnect if still connected
    if client.is_connected():
        client.disconnect()


@pytest.fixture
def app_context():
    """Create an application context for testing."""
    with app.app_context():
        yield app
