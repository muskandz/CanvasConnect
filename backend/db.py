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
    
    # Test the connection
    client.admin.command('ping')
    print("✅ MongoDB connection successful")
    
except Exception as e:
    print(f"❌ MongoDB connection failed: {str(e)}")
    print("⚠️  Application will continue but database operations will fail")
    client = None

db = client["canvasconnect"] if client else None
boards_collection = db["whiteboards"] if db else None
whiteboards = db["whiteboards"] if db else None 