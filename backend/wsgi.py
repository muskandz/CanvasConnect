import os
from app import app, socketio

# For production deployment (gunicorn)
application = app

# Production configuration
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    debug = os.environ.get("FLASK_ENV") == "development"
    
    print(f"Starting CanvasConnect Backend Server in {'DEVELOPMENT' if debug else 'PRODUCTION'} mode...")
    print(f"Server will be available on port: {port}")
    
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
