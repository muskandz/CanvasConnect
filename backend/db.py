import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

client = None
db = None
boards_collection = None
whiteboards = None

def connect_to_mongodb():
    global client, db, boards_collection, whiteboards

    mongo_uri = os.getenv("MONGO_URI")
    if not mongo_uri:
        print("MONGO_URI not found in environment variables.")
        return False

    try:
        client = MongoClient(
            mongo_uri,
            serverSelectionTimeoutMS=30000,
            connectTimeoutMS=20000,
            socketTimeoutMS=60000,
            maxPoolSize=10,
            minPoolSize=1,
            maxIdleTimeMS=45000,
            retryWrites=True,
            tz_aware=True
        )

        # Ping to check connection
        client.admin.command("ping")
        print("MongoDB connection successful")

        db = client["canvasconnect"]
        boards_collection = db["whiteboards"]
        whiteboards = db["whiteboards"]
        return True

    except Exception as e:
        print(f"MongoDB connection failed: {e}")
        client = None
        db = None
        return False

def test_mongodb_connection():
    """Test MongoDB connection without crashing the app"""
    try:
        if client is None:
            return False, "MongoDB client not initialized"
        client.admin.command("ping")
        return True, "Connected"
    except Exception as e:
        return False, str(e)

# Connect on module load
connect_to_mongodb()
