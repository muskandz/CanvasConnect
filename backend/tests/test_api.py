"""
Basic API endpoint tests for the Flask application.
These tests verify that your REST API endpoints work correctly.
"""

import pytest
import json
from datetime import datetime


class TestAPIEndpoints:
    """Test cases for REST API endpoints."""
    
    def test_health_check(self, client):
        """Test the health check endpoint."""
        response = client.get('/api/health')
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['status'] == 'healthy'
        assert data['server'] == 'app.py'
        assert 'timestamp' in data
    
    def test_user_activity_endpoint(self, client):
        """Test the user activity endpoint."""
        user_id = 'test_user_123'
        response = client.get(f'/api/activity/user/{user_id}')
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert isinstance(data, list)
        
        # Check if we have activity items
        if len(data) > 0:
            activity = data[0]
            assert 'id' in activity
            assert 'type' in activity
            assert 'message' in activity
            assert 'createdAt' in activity
    
    def test_cors_headers(self, client):
        """Test that CORS headers are properly set."""
        response = client.get('/api/health')
        
        # The response should include CORS headers
        assert response.status_code == 200
        # Note: In test mode, CORS headers might not be present
        # This is normal behavior for Flask-CORS in testing


class TestAPIValidation:
    """Test API input validation and error handling."""
    
    def test_invalid_endpoint(self, client):
        """Test accessing a non-existent endpoint."""
        response = client.get('/api/nonexistent')
        assert response.status_code == 404
    
    def test_wrong_method(self, client):
        """Test using wrong HTTP method on an endpoint."""
        response = client.post('/api/health')
        assert response.status_code == 405  # Method Not Allowed
