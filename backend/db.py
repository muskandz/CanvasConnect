import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

try:
    client = MongoClient(
        os.getenv("MONGO_URI"),
        serverSelectionTimeoutMS=30000,
        connectTimeoutMS=20000,
        socketTimeoutMS=60000,
        maxPoolSize=10,
        minPoolSize=1,
        maxIdleTimeMS=45000,
        retryWrites=True,
        tz_aware=True
    )

    try:
        client.admin.command('ping')
        print("MongoDB connection successful")
    except Exception as ping_err:
        print(f"MongoDB ping failed: {ping_err}")
        print("Database unreachable - falling back to mock data")
        client = None
except Exception as e:
    print(f"MongoDB client creation failed: {e}")
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
        
        client.admin.command('ping')
        return True, "Connected"
        
    except Exception as e:
        return False, str(e) 