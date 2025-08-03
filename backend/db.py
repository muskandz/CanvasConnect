import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

# Enhanced MongoDB connection with timeout and connection pooling settings
client = MongoClient(
    os.getenv("MONGO_URI"),
    serverSelectionTimeoutMS=5000,  # 5 second timeout for server selection
    connectTimeoutMS=10000,         # 10 second timeout for connection
    socketTimeoutMS=20000,          # 20 second timeout for socket operations
    maxPoolSize=10,                 # Maximum number of connections in the pool
    minPoolSize=1,                  # Minimum number of connections in the pool
    maxIdleTimeMS=30000,           # Close connections after 30 seconds of inactivity
    retryWrites=True               # Enable retryable writes
)

db = client["canvasconnect"]
boards_collection = db["whiteboards"]
whiteboards = db["whiteboards"] 