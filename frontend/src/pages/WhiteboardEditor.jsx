// src/pages/WhiteboardEditor.jsx
import React, { useRef, useState, useEffect } from "react";
import { Stage, Layer, Line, Rect, Text } from "react-konva"; // Added Rect and Text
import { useParams } from "react-router-dom";
import axios from "axios";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { v4 as uuidv4 } from 'uuid';
import { io } from "socket.io-client";
import VoiceControls from "../components/VoiceControls";

const socket = io("http://localhost:5000");
// Make socket available globally for voice chat
window.socket = socket;

const MODES = { DRAW: "draw", ERASE: "erase" };

export default function WhiteboardEditor() {
  const { id } = useParams(); // Whiteboard ID from route
  const [lines, setLines] = useState([]);
  const [notes, setNotes] = useState([]); // Added notes state
  const isDrawing = useRef(false);
  const [redoStack, setRedoStack] = useState([]);
  const [title, setTitle] = useState("Untitled");
  const [strokeColor, setStrokeColor] = useState("#000000");
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [mode, setMode] = useState(MODES.DRAW); 
  const layerRef = useRef(null);
  const [isVoiceConnected, setIsVoiceConnected] = useState(false);
  const [showAudioTest, setShowAudioTest] = useState(false);

  // Load board data when component mounts
  useEffect(() => {
    const fetchBoardData = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/boards/${id}`);
        const board = res.data;
        console.log("Loaded board:", board);
        if (Array.isArray(board.notes)) {
          setNotes(board.notes);
        }
        if (board.title) {
          setTitle(board.title);
        }
        if (Array.isArray(board.data)) {
          setLines(board.data);
        } else {
          console.warn("Invalid board data format");
        }
      } catch (err) {
        console.error("Error loading board", err);
      }
    };

    fetchBoardData();
  }, [id]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (lines.length > 0) {
        axios.put("http://localhost:5000/api/boards/update", {
          boardId: id,
          data: lines,
        }).catch(console.error);
      }
    }, 10000); // auto-save every 10s

    return () => clearInterval(interval);
  }, [lines]);

  // Join the board room
  useEffect(() => {
    if (id) {
      socket.emit("join", { room: id });
  
      socket.on('drawing', (data) => {
        setLines(prev => [...prev, data.line]);
      });
  
      socket.on('load_board_state', (data) => {
        if (data?.lines) setLines(data.lines);
        if (data?.notes) setNotes(data.notes);
      });
  
      return () => {
        socket.emit('leave', { room: id });
        socket.off('drawing');
        socket.off('load_board_state');
      };
    }
  }, [id]);  

  useEffect(() => {
    const interval = setInterval(() => {
      if (lines.length > 0 || notes.length > 0) {
        axios.put("http://localhost:5000/api/boards/update", {
          boardId: id,
          data: lines,
          notes: notes,
        }).catch(console.error);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [lines, notes]);

  // Drawing handlers
  const handleMouseDown = (e) => {
    if (mode === MODES.ERASE) {
      const clickedPos = e.target.getStage().getPointerPosition();
      const indexToRemove = lines.findIndex((line) => {
        const points = line.points;
        for (let i = 0; i < points.length; i += 2) {
          const dx = points[i] - clickedPos.x;
          const dy = points[i + 1] - clickedPos.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 10) return true;
        }
        return false;
      });
      if (indexToRemove !== -1) {
        const newLines = [...lines];
        const [removed] = newLines.splice(indexToRemove, 1);
        setRedoStack([...redoStack, removed]);
        setLines(newLines);
      }
      return;
    }

    // Drawing logic
    isDrawing.current = true;
    const pos = e.target.getStage().getPointerPosition();
    setLines([...lines, {
      points: [pos.x, pos.y],
      color: strokeColor,
      strokeWidth: strokeWidth,
    }]);
    setRedoStack([]);
  };
  
  const handleMouseMove = (e) => {
    if (!isDrawing.current || mode !== MODES.DRAW) return;
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    setLines((prevLines) => {
      const lastLine = { ...prevLines[prevLines.length - 1] };
      lastLine.points = [...lastLine.points, point.x, point.y];

      // Emit drawing event to other users
      socket.emit('drawing', {
        room: id,
        line: lastLine
      });
      
      return [...prevLines.slice(0, -1), lastLine];
    });
  };

  const handleMouseUp = () => {
    isDrawing.current = false;
  };

  const handleSave = async () => {
    try {
      await axios.put("http://localhost:5000/api/boards/update", {
        boardId: id,
        data: lines,
        notes: notes,
      });
      console.log("Board saved successfully");
    } catch (error) {
      console.error("Error saving board:", error);
    }
  };
  
  const handleUndo = () => {
    if (lines.length === 0) return;
    const newLines = [...lines];
    const popped = newLines.pop();
    setRedoStack([...redoStack, popped]);
    setLines(newLines);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const restored = redoStack[redoStack.length - 1];
    setLines([...lines, restored]);
    setRedoStack(redoStack.slice(0, -1));
  };

  const exportAsImage = async () => {
    const stageEl = document.getElementById("whiteboard-stage");
    const canvas = await html2canvas(stageEl);
    const link = document.createElement("a");
    link.download = `${title || "whiteboard"}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  const exportAsPDF = async () => {
    const stageEl = document.getElementById("whiteboard-stage");
    const canvas = await html2canvas(stageEl);
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "px",
      format: [canvas.width, canvas.height],
    });
    pdf.addImage(imgData, "PNG", 0, 0);
    pdf.save(`${title || "whiteboard"}.pdf`);
  };

  const toggleMode = () => {
    setMode(mode === MODES.DRAW ? MODES.ERASE : MODES.DRAW);
  };

  // Sticky Notes Handlers
  const addStickyNote = () => {
    const newNote = {
      id: uuidv4(),
      x: Math.random() * (window.innerWidth - 150),
      y: Math.random() * (window.innerHeight - 150),
      text: "New Sticky Note",
    };
    setNotes([...notes, newNote]);
    socket.emit('note_added', { room: id, note: newNote });
  };

  const handleNoteChange = (id, newText) => {
    const updatedNote = notes.find(note => note.id === id);
    if (updatedNote) {
      updatedNote.text = newText;
      setNotes(notes.map((note) => (note.id === id ? updatedNote : note)));
      socket.emit('note_updated', { room: id, note: updatedNote });
    }
  };

  const handleNoteDrag = (id, e) => {
    const updatedNote = notes.find(note => note.id === id);
    if (updatedNote) {
      updatedNote.x = e.target.x();
      updatedNote.y = e.target.y();
      
      const newNotes = notes.map((note) => {
        if (note.id === id) {
          return updatedNote;
        }
        return note;
      });
      
      setNotes(newNotes);
      socket.emit('note_updated', { room: id, note: updatedNote });
    }
  };

  const shareLink = `${window.location.origin}/whiteboard/${id}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareLink).then(() => {
      alert('Link copied to clipboard!');
    });
  };

  return (
    <div>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={async () => {
          try {
            await axios.put("http://localhost:5000/api/boards/update", {
              boardId: id,
              title: title,
            });
          } catch (err) {
            console.error("Failed to update title", err);
          }
        }}
        className="text-lg font-bold mb-2 border-b border-gray-400 focus:outline-none"
      />

      <div className="p-4 flex justify-between items-center">
        <h2 className="text-lg font-semibold">Whiteboard ID: {id}</h2>

        <div className="flex gap-4 items-center mb-2">
          <label>🖌️ Color: </label>
          <input
            type="color"
            value={strokeColor}
            onChange={(e) => setStrokeColor(e.target.value)}
            disabled={mode === MODES.ERASE}
          />
          <label>📏 Width:</label>
          <input
            type="range"
            min="1"
            max="10"
            value={strokeWidth}
            onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
            disabled={mode === MODES.ERASE}
          />

          <button onClick={toggleMode} className="px-3 py-1 bg-yellow-400 rounded">
            {mode === MODES.DRAW ? "🧽 Eraser" : "✏️ Draw"}
          </button>
        </div>
        <button onClick={addStickyNote} className="ml-2 bg-yellow-500 text-white px-2 py-1 rounded">
          ➕ Add Sticky Note
        </button>
        <div className="flex gap-2">
          <button onClick={handleSave} className="bg-green-600 text-white px-3 py-1 rounded">💾 Save</button>
          <button onClick={exportAsImage} className="bg-green-500 text-white px-2 py-1 rounded">📷 PNG</button>
          <button onClick={exportAsPDF} className="bg-purple-500 text-white px-2 py-1 rounded">📄 PDF</button>
          <button onClick={handleUndo}>↩️ Undo</button>
          <button onClick={handleRedo}>↪️ Redo</button>
          <button onClick={copyToClipboard} className="bg-indigo-500 text-white px-2 py-1 rounded">🔗 Share</button>
        </div>
      </div>
      
      <VoiceControls roomId={id} />

      <div id="whiteboard-stage">
        <Stage
          width={window.innerWidth}
          height={window.innerHeight - 100}
          onMouseDown={handleMouseDown}
          onMousemove={handleMouseMove}
          onMouseup={handleMouseUp}
          style={{ border: "1px solid #ccc", marginTop: "10px", cursor: mode === MODES.ERASE ? "crosshair" : "default" }}
        >
          <Layer ref={layerRef}>
            {lines.map((line, index) => (
              <Line
                key={index}
                points={line.points}
                stroke={line.color || "#000000"}
                strokeWidth={line.strokeWidth || 2}
                tension={0.5}
                lineCap="round"
                globalCompositeOperation="source-over"
              />
            ))}

            {notes.map((note) => (
              <React.Fragment key={note.id}>
                <Rect
                  x={note.x}
                  y={note.y}
                  width={150}
                  height={100}
                  fill="yellow"
                  draggable
                  onDragMove={(e) => handleNoteDrag(note.id, e)}
                />
                <Text
                  x={note.x + 10}
                  y={note.y + 10}
                  text={note.text}
                  fontSize={18}
                  width={130}
                  height={80}
                  draggable
                  onDragMove={(e) => handleNoteDrag(note.id, e)}
                  onClick={(e) => {
                    const newText = prompt("Edit note:", note.text);
                    if (newText !== null) {
                      handleNoteChange(note.id, newText);
                    }
                  }}
                />
              </React.Fragment>
            ))}
          </Layer>
        </Stage>
      </div>
    </div>
  );
}