# CanvasConnect Backend

A high-performance Flask backend with Socket.IO for real-time collaborative whiteboard functionality.

## Features

- **Real-time Collaboration**: Socket.IO integration for live drawing and cursors
- **Voice Chat**: WebRTC signaling for peer-to-peer voice communication
- **Board Management**: Complete CRUD operations for boards and templates
- **Comprehensive Testing**: 46 tests covering all API endpoints and Socket.IO events
- **Production Ready**: Optimized for deployment with proper CORS and security

## Quick Start

### Prerequisites
- Python 3.8+
- pip (Python package manager)

### Installation

1. **Navigate to backend directory**
   ```bash
   cd CanvasConnect/backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   
   # Windows
   venv\Scripts\activate
   
   # macOS/Linux
   source venv/bin/activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your configuration:
   ```env
   FLASK_ENV=development
   PORT=5000
   CORS_ORIGINS=http://localhost:5173,http://localhost:3000
   SECRET_KEY=your-secret-key-here
   ```

5. **Start development server**
   ```bash
   python app.py
   ```

   Server will be available at [http://localhost:5000](http://localhost:5000)

## Available Scripts

### Development
```bash
# Start development server
python app.py

# Start with production config
python wsgi.py

# Run tests
python -m pytest

# Run tests with coverage
python -m pytest --cov=app --cov-report=html

# Run specific test file
python -m pytest tests/test_boards.py -v
```


## Testing

Comprehensive test suite with **46 tests**:

```bash
# Run all tests
python -m pytest

# Run with verbose output
python -m pytest -v

# Run with coverage report
python -m pytest --cov=app --cov-report=html --cov-report=term-missing

# Test specific functionality
python -m pytest tests/test_boards.py::test_create_board -v
```

**Test Coverage:**
- Board CRUD operations
- Socket.IO events and room management
- WebRTC voice chat signaling
- Error handling and validation
- CORS and security headers

## API Endpoints

### Health & Status
- `GET /api/health` - Server health check

### Board Management
- `POST /api/boards` - Create new board
- `GET /api/boards/user/<userId>` - Get user's boards
- `GET /api/boards/<boardId>` - Get specific board
- `PUT /api/boards/update` - Update board
- `DELETE /api/boards/<boardId>` - Delete board

### Activity
- `GET /api/activity/user/<userId>` - Get user activity

### Socket.IO Events

#### Collaboration
- `join` - Join a board room
- `leave` - Leave a board room
- `drawing` - Send drawing data

#### Voice Chat
- `voice-join` - Join voice chat
- `voice-leave` - Leave voice chat
- `voice-offer` - WebRTC offer
- `voice-answer` - WebRTC answer
- `ice-candidate` - ICE candidate exchange

## Tech Stack

### Core
- **Flask 3.0** - Web framework
- **Flask-SocketIO** - Real-time communication
- **Eventlet** - Async networking library

### Real-time & Communication
- **Socket.IO** - WebSocket communication
- **WebRTC Signaling** - Peer-to-peer voice chat
- **CORS** - Cross-origin resource sharing

### Development & Testing
- **Pytest** - Testing framework
- **Coverage.py** - Test coverage reporting
- **Python-dotenv** - Environment variable management

## Project Structure

```
backend/
├── app.py              # Main Flask application
├── wsgi.py             # Production WSGI entry point
├── requirements.txt    # Python dependencies
├── pytest.ini         # Pytest configuration
├── .env.example        # Environment variables template
├── routes/             # API route blueprints
│   └── boards.py       # Board management routes
├── tests/              # Test suite
│   ├── test_app.py     # Main app tests
│   ├── test_boards.py  # Board API tests
│   └── test_sockets.py # Socket.IO tests
└── __pycache__/        # Python cache files
```

## 🔧 Configuration

### Environment Variables
- `FLASK_ENV` - Environment (development/production)
- `PORT` - Server port (default: 5000)
- `CORS_ORIGINS` - Allowed origins for CORS
- `SECRET_KEY` - Flask secret key for sessions

### Production Optimizations
- Eventlet async workers for Socket.IO
- Proper CORS configuration
- Error handling and logging
- Health check endpoints

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Add tests for new functionality
4. Ensure all tests pass (`python -m pytest`)
5. Update documentation
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Troubleshooting

### Common Issues

1. **Socket.IO Connection Issues**
   ```bash
   # Check CORS origins
   CORS_ORIGINS=http://localhost:5173,http://localhost:3000
   ```

2. **Port Already in Use**
   ```bash
   # Change port in .env
   PORT=5001
   ```

3. **Module Import Errors**
   ```bash
   # Ensure virtual environment is activated
   source venv/bin/activate  # macOS/Linux
   venv\Scripts\activate     # Windows
   ```

---

Built with ❤️ for real-time collaboration
