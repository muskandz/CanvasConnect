"""
Temporary startup file for Render deployment
This will be used until we fix the main app.py issues
"""
import os

# First try the working simple app
try:
    from simple_app import app
    print("✅ Starting with simple_app.py - temporary solution")
    application = app
except Exception as e:
    print(f"❌ Simple app failed: {e}")
    
    # Try the main app as fallback
    try:
        from app import app
        print("✅ Main app working - using full features")
        application = app
    except Exception as e2:
        print(f"❌ Main app also failed: {e2}")
        
        # Emergency Flask app
        from flask import Flask, jsonify
        from flask_cors import CORS
        
        emergency_app = Flask(__name__)
        CORS(emergency_app)
        
        @emergency_app.route('/api/health')
        def health():
            return jsonify({
                "status": "emergency", 
                "message": "Basic Flask running - check Render logs"
            })
            
        @emergency_app.route('/api/boards/user/<userId>')
        def get_boards(userId):
            return jsonify([{"id": "emergency", "title": "Emergency Mode"}])
        
        application = emergency_app
        print("⚠️ Running in emergency mode")

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    application.run(host="0.0.0.0", port=port, debug=False)
