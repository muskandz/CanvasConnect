# CanvasConnect

A collaborative whiteboard application that allows users to create, manage, and collaborate on drawings in real-time.

## Features

- **Canvas & File Management**: Create, delete, and manage files with a recycle bin.
- **Drawing Tools**: Use a variety of tools including pen, pencil, highlighter, and eraser (by stroke or area).
- **Editing Tools**: Features like undo/redo, sticky notes, and text with font styling.
- **Collaboration**: Real-time multi-user support using Socket.IO.
- **Voice Chat**: WebRTC-based communication for seamless collaboration.
- **Export**: Export your work to PDF or JPG formats.

## 🧩 Tech Stack

### Frontend
- **React**
- **Konva.js**: For drawing on the canvas.
- **Socket.IO Client**: For real-time communication.
- **WebRTC**: For voice chat functionality.
- **HTML5 Canvas API**: For rendering the drawing interface.
- **CSS Modules / Styled Components**: For styling the application.

### Backend
- **Python + Flask**: The web framework for the backend.
- **Flask-CORS**: For handling Cross-Origin Resource Sharing.
- **Flask-SocketIO**: For real-time communication.
- **WebRTC signaling**: Managed via Flask-SocketIO.
- **Export functionality**: Using Pyppeteer / ReportLab / Pillow for generating exports.
- **Database**: MongoDB Atlas or PostgreSQL (local).

```bash
CanvasConnect/  
├── frontend/      # Contains the React-based frontend application  
└── backend/       # Contains the Flask-based backend application  
```

## Getting Started

### Prerequisites

- Node.js (for the frontend)
- Python 3.x (for the backend)
- MongoDB Atlas account or PostgreSQL installed locally

### Frontend Setup

1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install the dependencies:

    ```bash
    npm install
    ```
3. Install the required packages:

    ```bash
    pip install -r requirements.txt
    ```

4. Start the development server:
    ```bash
    npm run dev
    ```
        
### Backend Setup
        
1. Navigate to the backend directory:

    ```bash
    cd backend
    ```
2. Create a virtual environment (optional but recommended):

    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows use `venv\Scripts\activate`
    ```
3. Install the required packages:

    ```bash
    pip install -r requirements.txt
    ```
4. Start the Flask server:

    ```bash
    python app.py  # Replace with your main Flask file if different
     ```
     
### Running the Project
        
Ensure both the frontend and backend servers are running.

Open your browser and navigate to http://localhost:5173 (or the port your frontend is running on) to access the application.