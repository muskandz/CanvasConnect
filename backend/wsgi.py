import os
from app import app, socketio

# For gunicorn deployment
app_instance = app

# Alternative names that gunicorn might look for
application = app

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    
    print("Starting CanvasConnect Backend Server...")
    print(f"Server will be available on port: {port}")
    print("Environment:", os.environ.get("FLASK_ENV", "development"))
    
    # Use socketio.run for direct execution
    socketio.run(app, 
                debug=False, 
                host="0.0.0.0", 
                port=port,
                use_reloader=False)
