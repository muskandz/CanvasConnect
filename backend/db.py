import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

# Enhanced MongoDB connection with timeout and connection pooling settings
try:
    client = MongoClient(
        os.getenv("MONGO_URI"),
        serverSelectionTimeoutMS=30000,  # 30 second timeout for server selection (increased for Render)
        connectTimeoutMS=20000,          # 20 second timeout for connection
        socketTimeoutMS=60000,           # 60 second timeout for socket operations
        maxPoolSize=10,                  # Maximum number of connections in the pool
        minPoolSize=1,                   # Minimum number of connections in the pool
        maxIdleTimeMS=45000,            # Close connections after 45 seconds of inactivity
        retryWrites=True,               # Enable retryable writes
        tz_aware=True                   # Make timezone aware
    )
    
    print("MongoDB client created - connection will be tested on first use")
    
except Exception as e:
    print(f"MongoDB client creation failed: {str(e)}")
    print("Application will continue but database operations will fail")
    client = None

db = client["canvasconnect"] if client is not None else None
boards_collection = db["whiteboards"] if db is not None else None
whiteboards = db["whiteboards"] if db is not None else None

def test_mongodb_connection():
    """Test MongoDB connection without crashing the app"""
    try:
        if client is None:
            return False, "MongoDB client not initialized"
        
        # Test the connection with a short timeout
        client.admin.command('ping')
        return True, "Connected"
        
    except Exception as e:
        return False, str(e) 