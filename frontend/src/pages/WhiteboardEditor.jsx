import React, { useRef, useState, useEffect } from "react";
import { Stage, Layer, Line, Rect, Text, Circle } from "react-konva"; // Added Circle for eraser cursor
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { v4 as uuidv4 } from 'uuid';
import { io } from "socket.io-client";
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Type } from 'lucide-react';

import {
  ArrowLeft,
  Save,
  Download,
  FileImage,
  FileText,
  Undo,
  Redo,
  Share,
  Palette,
  PenTool,
  Eraser,
  StickyNote,
  Grid3X3,
  Users,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Settings,
  Trash2,
  Copy,
  MousePointer,
  ZoomIn,
  ZoomOut,
  Move,
  RotateCcw,
  Eye,
  EyeOff,
  Plus,
  Minus,
  Phone,
  AlertCircle,
  CheckCircle,
  Highlighter
} from 'lucide-react';

// Template components
import { KanbanColumn } from "../components/templates/KanbanComponents";
import { MindMapNode, MindMapConnection } from "../components/templates/MindMapComponents";
import { FlowchartStart, FlowchartEnd, FlowchartProcess, FlowchartDecision, FlowchartArrow } from "../components/templates/FlowchartComponents";
import { PresentationSlide } from "../components/templates/PresentationComponents";
import { BrainstormTopic, BrainstormIdea, BrainstormTimer } from "../components/templates/BrainstormComponents";
import { MeetingHeader, MeetingSection } from "../components/templates/MeetingComponents";

const socket = io("http://localhost:5000"); // Back to port 5000
// Make socket available globally for voice chat
window.socket = socket;

const MODES = { DRAW: "draw", ERASE: "erase", HIGHLIGHT: "highlight" };

export default function WhiteboardEditor() {
  const { id } = useParams(); // Whiteboard ID from route
  const navigate = useNavigate();
  const [lines, setLines] = useState([]);
  const [notes, setNotes] = useState([]); // Added notes state
  const [templateData, setTemplateData] = useState([]); // Template-specific data
  const [templateType, setTemplateType] = useState("whiteboard"); // Board template type
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const isDrawing = useRef(false);
  const [redoStack, setRedoStack] = useState([]);
  const [title, setTitle] = useState("Untitled Whiteboard");
  const [strokeColor, setStrokeColor] = useState("#1f2937");
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [mode, setMode] = useState(MODES.DRAW); 
  const [selectedTool, setSelectedTool] = useState('pen');
  const [showGrid, setShowGrid] = useState(true);
  const [showColorPalette, setShowColorPalette] = useState(false);
  const [showStrokeWidthPanel, setShowStrokeWidthPanel] = useState(false);
  const [showEraserSizePanel, setShowEraserSizePanel] = useState(false);
  const [showHighlighterPanel, setShowHighlighterPanel] = useState(false);
  const [showBackgroundPanel, setShowBackgroundPanel] = useState(false);
  const [showExportPanel, setShowExportPanel] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState([]);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [isMicEnabled, setIsMicEnabled] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved', 'saving', 'error'
  const layerRef = useRef(null);
  const stageRef = useRef(null);
  const [isVoiceConnected, setIsVoiceConnected] = useState(false);
  const [showAudioTest, setShowAudioTest] = useState(false);
  const [textBoxes, setTextBoxes] = useState([]);
  const [selectedBox, setSelectedBox] = useState(null);
  const [isEditing, setIsEditing] = useState(null);
  const [dragState, setDragState] = useState({ isDragging: false, offset: { x: 0, y: 0 } });
  const canvasRef = useRef(null);
  const textAreaRef = useRef(null);

  const [eraserSize, setEraserSize] = useState(20); // Eraser size in pixels
  const [isErasing, setIsErasing] = useState(false);
  const [eraserPos, setEraserPos] = useState({ x: 0, y: 0 });
  const [highlighterColor, setHighlighterColor] = useState('#ffff00'); // Default yellow
  const [highlighterWidth, setHighlighterWidth] = useState(20); // Highlighter width

  // Implementing text boxes
  const defaultStyle = {
    fontSize: 16,
    fontWeight: 'normal',
    fontStyle: 'normal',
    textDecoration: 'none',
    textAlign: 'left',
    color: '#2d3748',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    fontFamily: '"Kalam", "Caveat", "Dancing Script", "Indie Flower", cursive'
  };

  useEffect(() => {
    console.log("TextBoxes state updated:", textBoxes);
  }, [textBoxes]);

  useEffect(() => {
    if (isEditing !== null && textAreaRef.current){
      const textarea = textAreaRef.current;
      textarea.focus();
      textarea.select();
      
      // Auto-resize textarea to fit content
      textarea.style.height = 'auto';
      textarea.style.height = Math.max(35, textarea.scrollHeight) + 'px';
    }
  }, [isEditing]);

  const createTextBox = (e) => {
    if (selectedTool !== 'text') return;
    
    // Don't create text box if clicking on an existing text box
    if (e.target.closest('.text-box')) return;
    
    // Get the canvas container
    const canvasContainer = document.getElementById('whiteboard-stage');
    if (!canvasContainer) return;
    
    const rect = canvasContainer.getBoundingClientRect();
    const newBox = {
      id: Date.now(),
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      text: 'Click to edit text',
      style: { ...defaultStyle },
      width: 200,
      height: 'auto'
    };
    console.log("Creating new text box:", newBox);
    setTextBoxes([...textBoxes, newBox]);
    setSelectedBox(newBox.id);
    
    // Force immediate save after creating text box
    setTimeout(() => {
      console.log("Force saving after text box creation");
      axios.put("http://localhost:5000/api/boards/update", {
        boardId: id,
        data: lines,
        notes: notes,
        textBoxes: [...textBoxes, newBox],
        background: backgroundColor,
        templateType: templateType
      }).then(response => {
        console.log("Force save successful:", response.data);
      }).catch(error => {
        console.error("Force save failed:", error);
      });
    }, 100);
  };

  const handleCanvasClick = (e) => {
    // If clicking on canvas and not in text mode, clear text box selection
    if (selectedTool !== 'text' && !e.target.closest('.text-box')) {
      setSelectedBox(null);
      setIsEditing(null);
    }
    
    if (selectedTool === 'text') {
      createTextBox(e);
    }
  };

  const handleDoubleClick = (boxId) => {
    setIsEditing(boxId);
    setSelectedBox(boxId);
  };

  const handleTextChange = (e) => {
    const value = e.target.value;
    console.log("Text changed:", value);
    const updatedTextBoxes = textBoxes.map(box =>
      box.id === isEditing ? { ...box, text: value } : box
    );
    setTextBoxes(updatedTextBoxes);
    
    // Force immediate save after text change
    setTimeout(() => {
      console.log("Force saving after text change");
      axios.put("http://localhost:5000/api/boards/update", {
        boardId: id,
        data: lines,
        notes: notes,
        textBoxes: updatedTextBoxes,
        background: backgroundColor,
        templateType: templateType
      }).then(response => {
        console.log("Text change save successful:", response.data);
      }).catch(error => {
        console.error("Text change save failed:", error);
      });
    }, 500);
  };

  const handleTextBlur = () => {
    setIsEditing(null);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      setIsEditing(null);
    }
  };

  const handleTextMouseDown = (e, boxId) => {
    if (isEditing) return;

    const box = textBoxes.find(b => b.id === boxId);
    if (!box) return;
    
    // Get the canvas container for proper offset calculation
    const canvasContainer = document.getElementById('whiteboard-stage');
    if (!canvasContainer) return;
    
    const canvasRect = canvasContainer.getBoundingClientRect();
    
    setSelectedBox(boxId);
    setDragState({
      isDragging: true,
      offset: {
        x: e.clientX - canvasRect.left - box.x,
        y: e.clientY - canvasRect.top - box.y
      }
    });
    
    // Prevent text selection during drag
    e.preventDefault();
  };

  const handleTextMouseMove = (e) => {
    if (!dragState.isDragging || !selectedBox) return;

    // Get the canvas container
    const canvasContainer = document.getElementById('whiteboard-stage');
    if (!canvasContainer) return;
    
    const rect = canvasContainer.getBoundingClientRect();
    const newX = e.clientX - rect.left - dragState.offset.x;
    const newY = e.clientY - rect.top - dragState.offset.y;

    setTextBoxes(boxes => 
      boxes.map(box => 
        box.id === selectedBox
          ? { ...box, x: Math.max(0, newX), y: Math.max(0, newY) }
          : box
      )
    );
  };

  const handleTextMouseUp = () => {
    setDragState({ isDragging: false, offset: { x: 0, y: 0 } });
  };

  const updateStyle = (property, value) => {
    if (!selectedBox) return;
    
    setTextBoxes(boxes =>
      boxes.map(box =>
        box.id === selectedBox
          ? { ...box, style: { ...box.style, [property]: value } }
          : box
      )
    );
  };

  const toggleBold = () => {
    const currentBox = textBoxes.find(box => box.id === selectedBox);
    const newWeight = currentBox?.style.fontWeight === 'bold' ? 'normal' : 'bold';
    updateStyle('fontWeight', newWeight);
  };

  const toggleItalic = () => {
    const currentBox = textBoxes.find(box => box.id === selectedBox);
    const newStyle = currentBox?.style.fontStyle === 'italic' ? 'normal' : 'italic';
    updateStyle('fontStyle', newStyle);
  };

  const toggleUnderline = () => {
    const currentBox = textBoxes.find(box => box.id === selectedBox);
    const newDecoration = currentBox?.style.textDecoration === 'underline' ? 'none' : 'underline';
    updateStyle('textDecoration', newDecoration);
  };

  const deleteSelected = () => {
    if (selectedBox) {
      setTextBoxes(boxes => boxes.filter(box => box.id !== selectedBox));
      setSelectedBox(null);
    }
  };

  // Enhanced eraser function with better line intersection detection
  const eraseAtPosition = (x, y) => {
    const eraserRadius = eraserSize / 2;
    const linesToRemove = [];

    lines.forEach((line, lineIndex) => {
      const points = line.points;
      let shouldErase = false;

      // Check each line segment for intersection with eraser circle
      for (let i = 0; i < points.length - 2; i += 2) {
        const x1 = points[i];
        const y1 = points[i + 1];
        const x2 = points[i + 2];
        const y2 = points[i + 3];

        // Distance from eraser center to line segment
        const distance = distanceToLineSegment(x, y, x1, y1, x2, y2);
        
        if (distance <= eraserRadius + (line.strokeWidth / 2)) {
          shouldErase = true;
          break;
        }
      }

      if (shouldErase) {
        linesToRemove.push(lineIndex);
      }
    });

    // Remove lines that intersect with eraser
    if (linesToRemove.length > 0) {
      const newLines = lines.filter((_, index) => !linesToRemove.includes(index));
      const removedLines = lines.filter((_, index) => linesToRemove.includes(index));
      
      setLines(newLines);
      setRedoStack([...redoStack, ...removedLines]);
      
      // Emit eraser action to other users
      socket.emit('erasing', {
        room: id,
        removedIndices: linesToRemove
      });
    }
  };

  // Helper function to calculate distance from point to line segment
  const distanceToLineSegment = (px, py, x1, y1, x2, y2) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.sqrt(dx * dx + dy * dy);
    
    if (length === 0) {
      // Line segment is actually a point
      return Math.sqrt((px - x1) * (px - x1) + (py - y1) * (py - y1));
    }
    
    // Calculate the projection of point onto line segment
    const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (length * length)));
    const projX = x1 + t * dx;
    const projY = y1 + t * dy;
    
    // Distance from point to projection
    return Math.sqrt((px - projX) * (px - projX) + (py - projY) * (py - projY));
  };

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (!isEditing && selectedBox) {
          deleteSelected();
        }
      }
    };

    const handleGlobalMouseMove = (e) => {
      if (dragState.isDragging && selectedBox) {
        handleTextMouseMove(e);
      }
    };

    const handleGlobalMouseUp = () => {
      if (dragState.isDragging) {
        handleTextMouseUp();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);
    
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [selectedBox, isEditing, dragState.isDragging]);

  // Click outside handler for dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if click is outside any dropdown
      if (!event.target.closest('.dropdown-panel') && !event.target.closest('.dropdown-trigger')) {
        setShowColorPalette(false);
        setShowStrokeWidthPanel(false);
        setShowEraserSizePanel(false);
        setShowHighlighterPanel(false);
        setShowBackgroundPanel(false);
        setShowExportPanel(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const selectedBoxData = textBoxes.find(box => box.id === selectedBox);

  const colorPalette = [
    '#1f2937', '#ef4444', '#10b981', '#3b82f6', '#f59e0b', 
    '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316',
    '#6366f1', '#14b8a6', '#f43f5e', '#8b5cf6', '#22c55e'
  ];

  const backgroundColors = [
    '#ffffff', '#f8fafc', '#f1f5f9', '#e2e8f0', '#cbd5e1',
    '#1e293b', '#0f172a', '#fef3c7', '#ecfdf5', '#dbeafe',
    '#f3e8ff', '#fce7f3'
  ];

  const strokeWidths = [1, 2, 3, 5, 8, 12, 16, 20];
  const eraserSizes = [10, 15, 20, 25, 30, 40, 50, 60];
  const highlighterColors = [
    '#ffff00', // Yellow
    '#00ff00', // Green
    '#ff69b4', // Pink
    '#00bfff', // Blue
    '#ffa500', // Orange
    '#ff1493', // Deep Pink
    '#7fff00', // Lime
    '#ff6347'  // Tomato
  ];
  const highlighterWidths = [10, 15, 20, 25, 30, 40];

  // Enhanced Voice communication with better error handling
  const localStreamRef = useRef(null);
  const peerConnectionsRef = useRef({});
  const socketRef = useRef(null);
  
  const [voiceStatus, setVoiceStatus] = useState('disconnected'); // disconnected, connecting, ready, error
  const [voiceError, setVoiceError] = useState(null);
  const [voiceDebug, setVoiceDebug] = useState([]);

  const rtcConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun.relay.metered.ca:80' },
      {
        urls: 'turn:openrelay.metered.ca:80',
        username: 'openrelayproject',
        credential: 'openrelayproject'
      }
    ],
    iceCandidatePoolSize: 10
  };

  const addVoiceDebug = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setVoiceDebug(prev => [...prev.slice(-3), `[${timestamp}] ${message}`]);
    console.log(`[Voice] ${message}`);
  };

  const initializeVoiceChat = async () => {
    try {
      setVoiceStatus('connecting');
      setVoiceError(null);
      addVoiceDebug('Initializing voice chat...');

      // Check WebRTC support
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('WebRTC not supported in this browser');
      }

      // Initialize socket connection
      if (!socketRef.current) {
        socketRef.current = socket; // Use existing socket
        setupVoiceSocketListeners();
      }

      // Get microphone access
      addVoiceDebug('Requesting microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        },
        video: false
      });

      localStreamRef.current = stream;
      addVoiceDebug('Microphone access granted');

      // Mute initially
      stream.getAudioTracks().forEach(track => {
        track.enabled = false;
      });

      // Join voice room
      socket.emit('voice-join', { room: id });
      addVoiceDebug(`Joined voice room: ${id}`);
      
      setIsVoiceConnected(true);
      setIsVoiceEnabled(true);
      setVoiceStatus('ready');

    } catch (err) {
      console.error('Voice initialization failed:', err);
      setVoiceError(err.message);
      setVoiceStatus('error');
      addVoiceDebug(`Error: ${err.message}`);
    }
  };

  const setupVoiceSocketListeners = () => {
    socket.on('user-joined', async (data) => {
      addVoiceDebug(`User joined: ${data.userId}`);
      setConnectedUsers(prev => [...prev, data.userId]);
      await createPeerConnection(data.userId, true);
    });

    socket.on('user-left', (data) => {
      addVoiceDebug(`User left: ${data.userId}`);
      setConnectedUsers(prev => prev.filter(id => id !== data.userId));
      
      if (peerConnectionsRef.current[data.userId]) {
        peerConnectionsRef.current[data.userId].close();
        delete peerConnectionsRef.current[data.userId];
      }
    });

    socket.on('voice-offer', async (data) => {
      addVoiceDebug(`Received offer from: ${data.userId}`);
      await handleVoiceOffer(data);
    });

    socket.on('voice-answer', async (data) => {
      addVoiceDebug(`Received answer from: ${data.userId}`);
      await handleVoiceAnswer(data);
    });

    socket.on('ice-candidate', async (data) => {
      addVoiceDebug(`Received ICE candidate from: ${data.userId}`);
      await handleIceCandidate(data);
    });
  };

  const createPeerConnection = async (userId, shouldCreateOffer = false) => {
    try {
      const pc = new RTCPeerConnection(rtcConfig);
      peerConnectionsRef.current[userId] = pc;

      // Add local stream
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          pc.addTrack(track, localStreamRef.current);
        });
      }

      // Handle remote stream
      pc.ontrack = (event) => {
        addVoiceDebug(`Received remote stream from: ${userId}`);
        const remoteAudio = document.getElementById(`audio-${userId}`) || document.createElement('audio');
        remoteAudio.id = `audio-${userId}`;
        remoteAudio.srcObject = event.streams[0];
        remoteAudio.autoplay = true;
        remoteAudio.style.display = 'none';
        remoteAudio.volume = 1.0;
        
        if (!document.getElementById(`audio-${userId}`)) {
          document.body.appendChild(remoteAudio);
        }

        // Force play
        remoteAudio.play().catch(e => {
          addVoiceDebug(`Audio play failed for ${userId}: ${e.message}`);
        });
      };

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('ice-candidate', {
            targetUserId: userId,
            candidate: event.candidate,
            room: id
          });
        }
      };

      pc.onconnectionstatechange = () => {
        addVoiceDebug(`Connection state with ${userId}: ${pc.connectionState}`);
      };

      if (shouldCreateOffer) {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        
        socket.emit('voice-offer', {
          targetUserId: userId,
          offer: offer,
          room: id
        });
      }

    } catch (err) {
      addVoiceDebug(`Error creating peer connection: ${err.message}`);
    }
  };

  const handleVoiceOffer = async (data) => {
    try {
      let pc = peerConnectionsRef.current[data.userId];
      if (!pc) {
        pc = await createPeerConnection(data.userId);
      }
      
      await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      
      socket.emit('voice-answer', {
        targetUserId: data.userId,
        answer: answer,
        room: id
      });
      
    } catch (err) {
      addVoiceDebug(`Error handling offer: ${err.message}`);
    }
  };

  const handleVoiceAnswer = async (data) => {
    try {
      const pc = peerConnectionsRef.current[data.userId];
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
      }
    } catch (err) {
      addVoiceDebug(`Error handling answer: ${err.message}`);
    }
  };

  const handleIceCandidate = async (data) => {
    try {
      const pc = peerConnectionsRef.current[data.userId];
      if (pc) {
        await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
      }
    } catch (err) {
      addVoiceDebug(`Error handling ICE candidate: ${err.message}`);
    }
  };

  const toggleMicrophone = async () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMicEnabled(!isMicEnabled);
      addVoiceDebug(`Microphone ${!isMicEnabled ? 'enabled' : 'disabled'}`);
    }
  };

  const toggleAudio = async () => {
    const audioElements = document.querySelectorAll('audio[id^="audio-"]');
    audioElements.forEach(audio => {
      audio.muted = isAudioEnabled;
    });
    setIsAudioEnabled(!isAudioEnabled);
    addVoiceDebug(`Audio ${!isAudioEnabled ? 'enabled' : 'disabled'}`);
  };

  const leaveVoiceChat = async () => {
    // Clean up peer connections
    Object.values(peerConnectionsRef.current).forEach(pc => pc.close());
    peerConnectionsRef.current = {};

    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    // Remove audio elements
    document.querySelectorAll('audio[id^="audio-"]').forEach(el => el.remove());

    // Leave socket room
    socket.emit('voice-leave', { room: id });

    setIsVoiceConnected(false);
    setIsVoiceEnabled(false);
    setIsMicEnabled(false);
    setIsAudioEnabled(true);
    setConnectedUsers([]);
    setVoiceStatus('disconnected');
    addVoiceDebug('Left voice chat');
  };

  // Load board data when component mounts
  useEffect(() => {
    // Test which backend server is running
    axios.get("http://localhost:5000/api/health")
      .then(response => {
        console.log("Backend server info:", response.data);
      })
      .catch(error => {
        console.error("Health check failed:", error);
      });
      
    const fetchBoardData = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/boards/${id}`);
        const board = res.data;
        console.log("Loaded board:", board);
        
        if (Array.isArray(board.notes)) {
          setNotes(board.notes);
        }
        if (Array.isArray(board.textBoxes)) {
          console.log("Loading text boxes:", board.textBoxes);
          setTextBoxes(board.textBoxes);
        } else {
          console.log("No text boxes found in board data");
        }
        if (board.title) {
          setTitle(board.title);
        }
        if (board.templateType) {
          setTemplateType(board.templateType);
        }
        if (board.background) {
          setBackgroundColor(board.background);
        }
        
        // Handle board data (drawing lines or template data)
        if (board.data) {
          if (Array.isArray(board.data)) {
            // Data is already an array
            if (board.data.length > 0 && board.data[0].type && board.data[0].type.includes('-')) {
              // This looks like template data
              setTemplateData(board.data);
            } else {
              // This looks like drawing lines
              setLines(board.data);
            }
          } else if (typeof board.data === 'string') {
            // Data is stringified, need to parse
            try {
              const parsedData = JSON.parse(board.data);
              if (Array.isArray(parsedData)) {
                if (parsedData.length > 0 && parsedData[0].type && parsedData[0].type.includes('-')) {
                  setTemplateData(parsedData);
                } else {
                  setLines(parsedData);
                }
              }
            } catch (parseError) {
              console.warn("Failed to parse board data", parseError);
            }
          }
        }
      } catch (err) {
        console.error("Error loading board", err);
      }
    };

    fetchBoardData();
  }, [id]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (lines.length > 0 || templateData.length > 0 || textBoxes.length > 0 || notes.length > 0) {
        console.log("Auto-saving with textBoxes:", textBoxes);
        const dataToSave = templateData.length > 0 ? templateData : lines;
        axios.put("http://localhost:5000/api/boards/update", {
          boardId: id,
          data: dataToSave, // Send data directly, not stringified
          notes: notes,
          textBoxes: textBoxes,
          background: backgroundColor,
          templateType: templateType
        }).then(response => {
          console.log("Auto-save successful:", response.data);
        }).catch(error => {
          console.error("Auto-save failed:", error);
        });
      }
    }, 10000); // auto-save every 10s

    return () => clearInterval(interval);
  }, [lines, templateData, textBoxes, notes, backgroundColor, templateType, id]);

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

  // Drawing handlers
  const handleMouseDown = (e) => {
    // Clear text box selection when clicking on canvas
    if (selectedTool !== 'text') {
      setSelectedBox(null);
    }
    
    if (mode === MODES.ERASE) {
      const stage = e.target.getStage();
      const pos = stage.getPointerPosition();
      setIsErasing(true);
      setEraserPos({ x: pos.x, y: pos.y });
      eraseAtPosition(pos.x, pos.y);
      return;
    }

    // Drawing logic (includes highlighter)
    if (selectedTool === 'pen' || mode === MODES.HIGHLIGHT) {
      isDrawing.current = true;
      const pos = e.target.getStage().getPointerPosition();
      
      const newLine = {
        points: [pos.x, pos.y],
        color: mode === MODES.HIGHLIGHT ? highlighterColor : strokeColor,
        strokeWidth: mode === MODES.HIGHLIGHT ? highlighterWidth : strokeWidth,
        isHighlight: mode === MODES.HIGHLIGHT,
        opacity: mode === MODES.HIGHLIGHT ? 0.4 : 1.0
      };
      
      setLines([...lines, newLine]);
      setRedoStack([]);
    }
  };
  
  const handleMouseMove = (e) => {
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    
    if (mode === MODES.ERASE) {
      setEraserPos({ x: point.x, y: point.y });
      
      if (isErasing) {
        eraseAtPosition(point.x, point.y);
      }
      return;
    }
    
    if (!isDrawing.current || (mode !== MODES.DRAW && mode !== MODES.HIGHLIGHT) || (selectedTool !== 'pen' && mode !== MODES.HIGHLIGHT)) return;
    
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
    setIsErasing(false);
  };

  const handleSave = async () => {
    try {
      console.log("Manual save with textBoxes:", textBoxes);
      setSaveStatus('saving');
      await axios.put("http://localhost:5000/api/boards/update", {
        boardId: id,
        data: lines,
        notes: notes,
        textBoxes: textBoxes,
        title: title,
        background: backgroundColor,
        templateType: templateType
      });
      console.log("Manual save successful");
      setLastSaved(new Date());
      setSaveStatus('saved');
      
      // Show success notification
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      notification.textContent = 'Whiteboard saved successfully!';
      document.body.appendChild(notification);
      setTimeout(() => document.body.removeChild(notification), 3000);
    } catch (error) {
      console.error("Error saving board:", error);
      setSaveStatus('error');
      
      // Show error notification
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      notification.textContent = 'Error saving whiteboard!';
      document.body.appendChild(notification);
      setTimeout(() => document.body.removeChild(notification), 3000);
    }
  };

  // Enhanced zoom functions
  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev * 1.2, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev / 1.2, 0.2));
  };

  const resetZoom = () => {
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
  };

  // Enhanced export functions
  const exportWithOptions = async (format, quality = 1) => {
    try {
      const stageEl = document.getElementById("whiteboard-stage");
      const canvas = await html2canvas(stageEl, {
        scale: quality,
        backgroundColor: backgroundColor,
        useCORS: true,
        allowTaint: true
      });
      
      if (format === 'png') {
        const link = document.createElement("a");
        link.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      } else if (format === 'pdf') {
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF({
          orientation: canvas.width > canvas.height ? "landscape" : "portrait",
          unit: "px",
          format: [canvas.width, canvas.height],
        });
        pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
        pdf.save(`${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${Date.now()}.pdf`);
      }
      
      // Show success notification
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      notification.textContent = `Whiteboard exported as ${format.toUpperCase()}!`;
      document.body.appendChild(notification);
      setTimeout(() => document.body.removeChild(notification), 3000);
    } catch (error) {
      console.error('Export error:', error);
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
    await exportWithOptions('png', 2); // High quality
  };

  const exportAsPDF = async () => {
    await exportWithOptions('pdf', 1.5); // Good quality for PDF
  };

  const toggleMode = () => {
    setMode(mode === MODES.DRAW ? MODES.ERASE : MODES.DRAW);
    setSelectedTool(mode === MODES.DRAW ? 'eraser' : 'pen');
  };

  // Enhanced sticky note functions
  const addStickyNote = () => {
    const colors = ['#fef08a', '#fecaca', '#bfdbfe', '#c7d2fe', '#d8b4fe', '#f9a8d4'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    
    const newNote = {
      id: uuidv4(),
      x: Math.random() * (window.innerWidth - 200) + 50,
      y: Math.random() * (window.innerHeight - 200) + 100,
      text: "Click to edit...",
      color: randomColor,
      fontSize: 14,
      width: 180,
      height: 120
    };
    setNotes([...notes, newNote]);
    socket.emit('note_added', { room: id, note: newNote });
  };

  const deleteNote = (noteId) => {
    setNotes(notes.filter(note => note.id !== noteId));
    socket.emit('note_deleted', { room: id, noteId });
  };

  const duplicateNote = (note) => {
    const newNote = {
      ...note,
      id: uuidv4(),
      x: note.x + 20,
      y: note.y + 20,
      text: note.text + ' (Copy)'
    };
    setNotes([...notes, newNote]);
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

  const updateTemplateItem = (itemId, updatedItem) => {
    setTemplateData(prev => prev.map(item => 
      item.id === itemId ? updatedItem : item
    ));
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareLink).then(() => {
      // Show a better success message
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      notification.textContent = 'Share link copied to clipboard!';
      document.body.appendChild(notification);
      setTimeout(() => document.body.removeChild(notification), 3000);
    });
  };

  const clearBoard = () => {
    if (window.confirm('Are you sure you want to clear the entire whiteboard? This action cannot be undone.')) {
      setLines([]);
      setNotes([]);
      setTextBoxes([]);
      setTemplateData([]);
      setRedoStack([]);
      setSelectedBox(null);
      setIsEditing(null);
    }
  };

  // Template renderer
  const renderTemplateComponents = () => {
    return templateData.map(item => {
      switch (item.type) {
        case 'kanban-column':
          return <KanbanColumn key={item.id} column={item} onUpdate={updateTemplateItem} />;
        
        case 'mindmap-node':
          return <MindMapNode key={item.id} node={item} onUpdate={updateTemplateItem} />;
        
        case 'mindmap-connection':
          return <MindMapConnection key={item.id} connection={item} nodes={templateData.filter(n => n.type === 'mindmap-node')} />;
        
        case 'flowchart-start':
          return <FlowchartStart key={item.id} node={item} onUpdate={updateTemplateItem} />;
        
        case 'flowchart-end':
          return <FlowchartEnd key={item.id} node={item} onUpdate={updateTemplateItem} />;
        
        case 'flowchart-process':
          return <FlowchartProcess key={item.id} node={item} onUpdate={updateTemplateItem} />;
        
        case 'flowchart-decision':
          return <FlowchartDecision key={item.id} node={item} onUpdate={updateTemplateItem} />;
        
        case 'flowchart-arrow':
          return <FlowchartArrow key={item.id} arrow={item} nodes={templateData.filter(n => n.type?.startsWith('flowchart-') && n.type !== 'flowchart-arrow')} />;
        
        case 'presentation-slide':
          return <PresentationSlide key={item.id} slide={item} onUpdate={updateTemplateItem} isActive={item.isActive} />;
        
        case 'brainstorm-topic':
          return <BrainstormTopic key={item.id} topic={item} onUpdate={updateTemplateItem} />;
        
        case 'brainstorm-idea':
          return <BrainstormIdea key={item.id} idea={item} onUpdate={updateTemplateItem} />;
        
        case 'meeting-header':
          return <MeetingHeader key={item.id} header={item} onUpdate={updateTemplateItem} />;
        
        case 'meeting-section':
          return <MeetingSection key={item.id} section={item} onUpdate={updateTemplateItem} />;
        
        default:
          return null;
      }
    });
  };

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex flex-col relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25px 25px, rgba(59, 130, 246, 0.15) 2px, transparent 0)`,
          backgroundSize: '50px 50px'
        }}></div>
      </div>
      
      {/* Enhanced Glassmorphism Header */}
      <div className="relative bg-white/70 backdrop-blur-xl border-b border-white/20 shadow-lg shadow-blue-500/10 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="group p-3 hover:bg-white/50 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20 hover:scale-105"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600 group-hover:text-blue-600 transition-colors" />
            </button>
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
              className="text-2xl font-bold bg-white/30 backdrop-blur-sm border border-white/20 outline-none focus:bg-white/40 focus:border-blue-300/50 focus:ring-2 focus:ring-blue-500/20 px-4 py-2 rounded-xl transition-all duration-300 placeholder:text-slate-400 text-slate-700"
              placeholder="Untitled Whiteboard"
            />
            <div className="px-4 py-2 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 backdrop-blur-sm text-blue-700 rounded-full text-sm font-semibold border border-blue-200/50 shadow-sm">
              {templateType !== 'whiteboard' ? `${templateType.replace('-', ' ')} Template` : 'Whiteboard'}
            </div>
            {lastSaved && (
              <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 backdrop-blur-sm text-green-700 rounded-lg border border-green-200/50">
                <CheckCircle className="w-4 h-4" />
                <span className="text-xs font-medium">
                  Saved {lastSaved.toLocaleTimeString()}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            {/* Enhanced Glassmorphism Voice Controls */}
            <div className="flex items-center gap-2 px-4 py-2 bg-white/40 backdrop-blur-lg rounded-2xl border border-white/30 shadow-lg shadow-blue-500/10">
              {!isVoiceEnabled ? (
                <button
                  onClick={initializeVoiceChat}
                  disabled={voiceStatus === 'connecting'}
                  className="group flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-300 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-green-500/25 hover:scale-105"
                >
                  {voiceStatus === 'connecting' ? (
                    <AlertCircle className="w-4 h-4 animate-spin" />
                  ) : voiceStatus === 'error' ? (
                    <AlertCircle className="w-4 h-4" />
                  ) : (
                    <Mic className="w-4 h-4" />
                  )}
                  {voiceStatus === 'connecting' ? 'Connecting...' : voiceStatus === 'error' ? 'Retry Voice' : 'Join Voice'}
                </button>
              ) : (
                <>
                  <button
                    onClick={toggleMicrophone}
                    className={`group p-3 rounded-xl transition-all duration-300 hover:scale-105 ${
                      isMicEnabled 
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/25' 
                        : 'bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-lg shadow-red-500/25'
                    }`}
                    title={isMicEnabled ? 'Mute Microphone' : 'Unmute Microphone'}
                  >
                    {isMicEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={toggleAudio}
                    className={`group p-3 rounded-xl transition-all duration-300 hover:scale-105 ${
                      isAudioEnabled 
                        ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/25' 
                        : 'bg-gradient-to-r from-gray-500 to-slate-500 text-white shadow-lg shadow-gray-500/25'
                    }`}
                    title={isAudioEnabled ? 'Mute Audio' : 'Unmute Audio'}
                  >
                    {isAudioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={leaveVoiceChat}
                    className="group p-3 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl hover:from-red-700 hover:to-rose-700 transition-all duration-300 shadow-lg hover:shadow-red-500/25 hover:scale-105"
                    title="Leave Voice Chat"
                  >
                    <Phone className="w-4 h-4" />
                  </button>
                  {connectedUsers.length > 0 && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-green-500/20 backdrop-blur-sm text-green-700 rounded-xl text-sm font-medium border border-green-200/50 ml-2">
                      <Users className="w-4 h-4" />
                      <span>{connectedUsers.length}</span>
                    </div>
                  )}
                </>
              )}
            </div>

            {connectedUsers.length > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 bg-green-500/20 backdrop-blur-lg text-green-700 rounded-2xl border border-green-200/50 shadow-lg">
                <Users className="w-5 h-5" />
                <span className="text-sm font-semibold">{connectedUsers.length} online</span>
              </div>
            )}
            
            <button
              onClick={handleSave}
              disabled={saveStatus === 'saving'}
              className={`group flex items-center gap-2 px-6 py-3 rounded-2xl transition-all duration-300 font-medium shadow-lg hover:scale-105 ${
                saveStatus === 'saving' 
                  ? 'bg-gray-400/50 cursor-not-allowed text-gray-600' 
                  : saveStatus === 'error'
                  ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white shadow-red-500/25'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-blue-500/25'
              }`}
            >
              <Save className="w-4 h-4" />
              {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'error' ? 'Retry' : 'Save'}
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Glassmorphism Main Toolbar */}
      <div className="relative bg-white/60 backdrop-blur-xl border-b border-white/20 px-6 py-4 shadow-lg shadow-blue-500/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            {/* Enhanced Drawing Tools */}
            <div className="flex items-center gap-2 p-2 bg-white/40 backdrop-blur-sm rounded-2xl border border-white/30 shadow-lg">
              <button
                onClick={() => {
                  setSelectedTool('select');
                  setMode(MODES.DRAW);
                }}
                className={`group flex items-center gap-2 px-4 py-2 rounded-xl border transition-all duration-300 font-medium hover:scale-105 ${
                  selectedTool === 'select'
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-500 border-blue-300/50 text-white shadow-lg shadow-blue-500/25'
                    : 'hover:bg-white/60 border-white/30 text-slate-700 hover:shadow-md backdrop-blur-sm'
                }`}
              >
                <MousePointer className="w-4 h-4" />
                <span className="text-sm">Select</span>
              </button>
              
              <button
                onClick={() => {
                  setSelectedTool('pen');
                  setMode(MODES.DRAW);
                }}
                className={`group flex items-center gap-2 px-4 py-2 rounded-xl border transition-all duration-300 font-medium hover:scale-105 ${
                  selectedTool === 'pen' && mode === MODES.DRAW
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 border-purple-300/50 text-white shadow-lg shadow-purple-500/25'
                    : 'hover:bg-white/60 border-white/30 text-slate-700 hover:shadow-md backdrop-blur-sm'
                }`}
              >
                <PenTool className="w-4 h-4" />
                <span className="text-sm">Pen</span>
              </button>
              
              <button
                onClick={() => {
                  setSelectedTool('highlighter');
                  setMode(MODES.HIGHLIGHT);
                  setShowColorPalette(false);
                  setShowStrokeWidthPanel(false);
                  setShowBackgroundPanel(false);
                  setShowExportPanel(false);
                  setShowEraserSizePanel(false);
                }}
                className={`group flex items-center gap-2 px-4 py-2 rounded-xl border transition-all duration-300 font-medium hover:scale-105 ${
                  mode === MODES.HIGHLIGHT
                    ? 'bg-gradient-to-r from-yellow-500 to-orange-500 border-yellow-300/50 text-white shadow-lg shadow-yellow-500/25'
                    : 'hover:bg-white/60 border-white/30 text-slate-700 hover:shadow-md backdrop-blur-sm'
                }`}
              >
                <Highlighter className="w-4 h-4" />
                <span className="text-sm">Highlighter</span>
              </button>
              
              <button
                onClick={() => {
                  setSelectedTool('text');
                  setMode(MODES.DRAW);
                }}
                className={`group flex items-center gap-2 px-4 py-2 rounded-xl border transition-all duration-300 font-medium hover:scale-105 ${
                  selectedTool === 'text'
                    ? 'bg-gradient-to-r from-teal-500 to-cyan-500 border-teal-300/50 text-white shadow-lg shadow-teal-500/25'
                    : 'hover:bg-white/60 border-white/30 text-slate-700 hover:shadow-md backdrop-blur-sm'
                }`}
              >
                <Type className="w-4 h-4" />
                <span className="text-sm">Text</span>
              </button>
              
              <button
                onClick={() => {
                  setSelectedTool('eraser');
                  setMode(MODES.ERASE);
                  setShowColorPalette(false);
                  setShowStrokeWidthPanel(false);
                  setShowBackgroundPanel(false);
                  setShowExportPanel(false);
                }}
                className={`group flex items-center gap-2 px-4 py-2 rounded-xl border transition-all duration-300 font-medium hover:scale-105 ${
                  mode === MODES.ERASE
                    ? 'bg-gradient-to-r from-red-500 to-rose-500 border-red-300/50 text-white shadow-lg shadow-red-500/25'
                    : 'hover:bg-white/60 border-white/30 text-slate-700 hover:shadow-md backdrop-blur-sm'
                }`}
              >
                <Eraser className="w-4 h-4" />
                <span className="text-sm">Eraser</span>
              </button>

              {/* Enhanced Eraser Size Control */}
              {mode === MODES.ERASE && (
                <div className="relative">
                  <button
                    onClick={() => setShowEraserSizePanel(!showEraserSizePanel)}
                    className="dropdown-trigger group flex items-center gap-3 px-4 py-2 rounded-xl border border-white/30 hover:bg-white/60 transition-all duration-300 backdrop-blur-sm hover:shadow-lg hover:scale-105"
                  >
                    <div 
                      className="rounded-full bg-gradient-to-r from-red-400 to-rose-400 border border-red-300/50 shadow-sm"
                      style={{ 
                        width: Math.min(20, eraserSize / 2), 
                        height: Math.min(20, eraserSize / 2) 
                      }}
                    ></div>
                    <span className="text-sm font-medium text-slate-700">{eraserSize}px</span>
                  </button>
                  
                  {showEraserSizePanel && (
                    <div className="dropdown-panel absolute top-full left-0 mt-3 p-4 bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 z-[9999] min-w-[280px]">
                      <div className="grid grid-cols-4 gap-3">
                        {eraserSizes.map((size) => (
                          <button
                            key={size}
                            onClick={() => {
                              setEraserSize(size);
                              setShowEraserSizePanel(false);
                            }}
                            className={`group flex items-center justify-center p-3 rounded-xl border transition-all duration-300 hover:scale-105 ${
                              eraserSize === size 
                                ? 'bg-gradient-to-r from-red-500 to-rose-500 border-red-300/50 text-white shadow-lg shadow-red-500/25' 
                                : 'hover:bg-white/80 border-white/30 hover:shadow-md backdrop-blur-sm'
                            }`}
                          >
                            <div 
                              className={`rounded-full ${eraserSize === size ? 'bg-white/80' : 'bg-red-300'}`}
                              style={{ 
                                width: Math.min(24, size / 2), 
                                height: Math.min(24, size / 2) 
                              }}
                            ></div>
                          </button>
                        ))}
                      </div>
                      <div className="text-xs text-slate-500 mt-3 text-center font-medium">Eraser Size</div>
                    </div>
                  )}
                </div>
              )}

              {/* Enhanced Highlighter Controls */}
              {mode === MODES.HIGHLIGHT && (
                <div className="relative">
                  <button
                    onClick={() => setShowHighlighterPanel(!showHighlighterPanel)}
                    className="dropdown-trigger group flex items-center gap-3 px-4 py-2 rounded-xl border border-white/30 hover:bg-white/60 transition-all duration-300 backdrop-blur-sm hover:shadow-lg hover:scale-105"
                  >
                    <div 
                      className="w-8 h-4 rounded-lg border border-white/20 shadow-sm"
                      style={{ backgroundColor: highlighterColor, opacity: 0.7 }}
                    ></div>
                    <span className="text-sm font-medium text-slate-700">{highlighterWidth}px</span>
                  </button>
                  
                  {showHighlighterPanel && (
                    <div className="dropdown-panel absolute top-full left-0 mt-3 p-5 bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 z-[9999] min-w-[320px]">
                      <div className="mb-4">
                        <div className="text-sm font-semibold text-slate-700 mb-3">Colors</div>
                        <div className="grid grid-cols-4 gap-3 mb-4">
                          {highlighterColors.map((color) => (
                            <button
                              key={color}
                              onClick={() => setHighlighterColor(color)}
                              className={`group w-10 h-6 rounded-lg border-2 hover:scale-110 transition-all duration-300 hover:shadow-lg ${
                                highlighterColor === color 
                                  ? 'border-slate-400 ring-2 ring-blue-500/50 shadow-lg' 
                                  : 'border-white/30 hover:border-slate-300'
                              }`}
                              style={{ backgroundColor: color, opacity: 0.7 }}
                            />
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-sm font-semibold text-slate-700 mb-3">Width</div>
                        <div className="grid grid-cols-3 gap-3">
                          {highlighterWidths.map((width) => (
                            <button
                              key={width}
                              onClick={() => {
                                setHighlighterWidth(width);
                                setShowHighlighterPanel(false);
                              }}
                              className={`group flex items-center justify-center p-3 rounded-xl border transition-all duration-300 hover:scale-105 ${
                                highlighterWidth === width 
                                  ? 'bg-gradient-to-r from-yellow-500 to-orange-500 border-yellow-300/50 text-white shadow-lg shadow-yellow-500/25' 
                                  : 'hover:bg-white/80 border-white/30 hover:shadow-md backdrop-blur-sm'
                              }`}
                            >
                              <div 
                                className="rounded-lg"
                                style={{ 
                                  width: '24px', 
                                  height: `${Math.min(8, width / 4)}px`,
                                  backgroundColor: highlighterColor,
                                  opacity: 0.7
                                }}
                              ></div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="h-8 w-px bg-gradient-to-b from-transparent via-slate-300 to-transparent"></div>

            {/* Enhanced Color Picker */}
            <div className="relative">
              <button
                onClick={() => setShowColorPalette(!showColorPalette)}
                className="dropdown-trigger group flex items-center gap-3 px-4 py-2 rounded-xl border border-white/30 hover:bg-white/60 transition-all duration-300 backdrop-blur-sm hover:shadow-lg hover:scale-105"
              >
                <Palette className="w-4 h-4 text-slate-600" />
                <div 
                  className="w-8 h-8 rounded-xl border-2 border-white shadow-lg"
                  style={{ backgroundColor: strokeColor }}
                ></div>
              </button>
              
              {showColorPalette && (
                <div className="dropdown-panel absolute top-full left-0 mt-3 p-5 bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 z-[9999] min-w-[280px]">
                  <div className="grid grid-cols-5 gap-3 mb-4">
                    {colorPalette.map((color) => (
                      <button
                        key={color}
                        onClick={() => {
                          setStrokeColor(color);
                          setShowColorPalette(false);
                        }}
                        className={`group w-10 h-10 rounded-xl border-2 hover:scale-110 transition-all duration-300 hover:shadow-lg ${
                          strokeColor === color 
                            ? 'border-slate-400 ring-2 ring-blue-500/50 shadow-lg' 
                            : 'border-white/30 hover:border-slate-300'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <div className="border-t border-white/20 pt-4">
                    <label className="text-sm font-semibold text-slate-700 mb-2 block">Custom Color</label>
                    <input
                      type="color"
                      value={strokeColor}
                      onChange={(e) => setStrokeColor(e.target.value)}
                      className="w-full h-10 rounded-xl border border-white/30 cursor-pointer bg-white/50 backdrop-blur-sm"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Enhanced Stroke Width */}
            <div className="relative">
              <button
                onClick={() => setShowStrokeWidthPanel(!showStrokeWidthPanel)}
                className="dropdown-trigger group flex items-center gap-3 px-4 py-2 rounded-xl border border-white/30 hover:bg-white/60 transition-all duration-300 backdrop-blur-sm hover:shadow-lg hover:scale-105"
              >
                <div className="flex items-center gap-2">
                  <div 
                    className="rounded-full bg-slate-700 shadow-sm"
                    style={{ width: `${Math.min(strokeWidth * 2, 20)}px`, height: `${Math.min(strokeWidth * 2, 20)}px` }}
                  ></div>
                  <span className="text-sm font-medium text-slate-700">{strokeWidth}px</span>
                </div>
              </button>
              
              {showStrokeWidthPanel && (
                <div className="dropdown-panel absolute top-full left-0 mt-3 p-5 bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 z-[9999] min-w-[280px]">
                  <div className="flex flex-col gap-3 mb-4">
                    {strokeWidths.map((width) => (
                      <button
                        key={width}
                        onClick={() => {
                          setStrokeWidth(width);
                          setShowStrokeWidthPanel(false);
                        }}
                        className={`group flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-white/80 transition-all duration-300 hover:scale-105 ${
                          strokeWidth === width ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/25' : 'hover:shadow-md backdrop-blur-sm border border-white/30'
                        }`}
                      >
                        <div 
                          className={`rounded-full shadow-sm ${strokeWidth === width ? 'bg-white/80' : 'bg-slate-700'}`}
                          style={{ width: `${width}px`, height: `${width}px` }}
                        ></div>
                        <span className="text-sm font-medium">{width}px</span>
                      </button>
                    ))}
                  </div>
                  <div className="border-t border-white/20 pt-4">
                    <label className="text-sm font-semibold text-slate-700 mb-2 block">Custom Width</label>
                    <input
                      type="range"
                      min="1"
                      max="50"
                      value={strokeWidth}
                      onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
                      className="w-full h-2 bg-white/50 rounded-lg appearance-none cursor-pointer backdrop-blur-sm"
                      style={{
                        background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(strokeWidth/50)*100}%, rgba(255,255,255,0.5) ${(strokeWidth/50)*100}%, rgba(255,255,255,0.5) 100%)`
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="h-8 w-px bg-gradient-to-b from-transparent via-slate-300 to-transparent"></div>

            {/* Enhanced Background Color */}
            <div className="relative">
              <button
                onClick={() => setShowBackgroundPanel(!showBackgroundPanel)}
                className="dropdown-trigger group flex items-center gap-3 px-4 py-2 rounded-xl border border-white/30 hover:bg-white/60 transition-all duration-300 backdrop-blur-sm hover:shadow-lg hover:scale-105"
              >
                <div 
                  className="w-8 h-8 rounded-xl border-2 border-white/50 shadow-lg"
                  style={{ backgroundColor: backgroundColor }}
                ></div>
                <span className="text-sm font-medium text-slate-700">Background</span>
              </button>
              
              {showBackgroundPanel && (
                <div className="dropdown-panel absolute top-full left-0 mt-3 p-5 bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 z-[9999] min-w-[280px]">
                  <div className="grid grid-cols-4 gap-3">
                    {backgroundColors.map((color) => (
                      <button
                        key={color}
                        onClick={() => {
                          setBackgroundColor(color);
                          setShowBackgroundPanel(false);
                        }}
                        className={`group w-10 h-10 rounded-xl border-2 hover:scale-110 transition-all duration-300 hover:shadow-lg ${
                          backgroundColor === color 
                            ? 'border-slate-400 ring-2 ring-blue-500/50 shadow-lg' 
                            : 'border-white/30 hover:border-slate-300'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Enhanced Sticky Note */}
            <button
              onClick={addStickyNote}
              className="group flex items-center gap-3 px-4 py-2 rounded-xl border border-white/30 hover:bg-white/60 transition-all duration-300 backdrop-blur-sm hover:shadow-lg hover:scale-105"
            >
              <StickyNote className="w-4 h-4 text-slate-600" />
              <span className="text-sm font-medium text-slate-700">Note</span>
            </button>

            {/* Enhanced Grid Toggle */}
            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`group flex items-center gap-3 px-4 py-2 rounded-xl border transition-all duration-300 backdrop-blur-sm hover:scale-105 ${
                showGrid
                  ? 'bg-gradient-to-r from-slate-500 to-gray-500 border-slate-300/50 text-white shadow-lg shadow-slate-500/25'
                  : 'border-white/30 hover:bg-white/60 text-slate-700 hover:shadow-lg'
              }`}
            >
              <Grid3X3 className="w-4 h-4" />
              <span className="text-sm font-medium">Grid</span>
            </button>
          </div>

          <div className="flex items-center gap-4">
            {/* Enhanced Zoom Controls */}
            <div className="flex items-center gap-2 p-2 bg-white/40 backdrop-blur-lg rounded-2xl border border-white/30 shadow-lg">
              <button
                onClick={handleZoomOut}
                className="group p-2 hover:bg-white/60 rounded-xl transition-all duration-300 hover:scale-105"
              >
                <ZoomOut className="w-4 h-4 text-slate-600" />
              </button>
              <span className="text-sm font-bold px-3 py-1 bg-white/50 rounded-lg text-slate-700 min-w-[60px] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={handleZoomIn}
                className="group p-2 hover:bg-white/60 rounded-xl transition-all duration-300 hover:scale-105"
              >
                <ZoomIn className="w-4 h-4 text-slate-600" />
              </button>
              <button
                onClick={resetZoom}
                className="group p-2 hover:bg-white/60 rounded-xl transition-all duration-300 hover:scale-105"
                title="Reset Zoom"
              >
                <RotateCcw className="w-4 h-4 text-slate-600" />
              </button>
            </div>

            {/* Enhanced Undo/Redo */}
            <div className="flex items-center gap-2 p-2 bg-white/40 backdrop-blur-lg rounded-2xl border border-white/30 shadow-lg">
              <button
                onClick={handleUndo}
                disabled={lines.length === 0}
                className={`group p-2 rounded-xl transition-all duration-300 hover:scale-105 ${
                  lines.length === 0 
                    ? 'opacity-40 cursor-not-allowed' 
                    : 'hover:bg-white/60 text-slate-600'
                }`}
              >
                <Undo className="w-4 h-4" />
              </button>
              
              <button
                onClick={handleRedo}
                disabled={redoStack.length === 0}
                className={`group p-2 rounded-xl transition-all duration-300 hover:scale-105 ${
                  redoStack.length === 0 
                    ? 'opacity-40 cursor-not-allowed' 
                    : 'hover:bg-white/60 text-slate-600'
                }`}
              >
                <Redo className="w-4 h-4" />
              </button>
            </div>

            <div className="h-8 w-px bg-gradient-to-b from-transparent via-slate-300 to-transparent"></div>

            {/* Enhanced Export Options */}
            <div className="relative">
              <button
                onClick={() => setShowExportPanel(!showExportPanel)}
                className="dropdown-trigger group flex items-center gap-3 px-4 py-2 rounded-xl border border-white/30 hover:bg-white/60 transition-all duration-300 backdrop-blur-sm hover:shadow-lg hover:scale-105"
              >
                <Download className="w-4 h-4 text-slate-600" />
                <span className="text-sm font-medium text-slate-700">Export</span>
              </button>
              
              {showExportPanel && (
                <div className="dropdown-panel absolute top-full right-0 mt-3 p-3 bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 z-[9999] min-w-[200px]">
                  <button
                    onClick={() => {
                      exportAsImage();
                      setShowExportPanel(false);
                    }}
                    className="group flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/80 transition-all duration-300 w-full text-left hover:scale-105 border border-white/30 mb-2"
                  >
                    <FileImage className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-slate-700">Export as PNG</span>
                  </button>
                  <button
                    onClick={() => {
                      exportAsPDF();
                      setShowExportPanel(false);
                    }}
                    className="group flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/80 transition-all duration-300 w-full text-left hover:scale-105 border border-white/30"
                  >
                    <FileText className="w-4 h-4 text-red-600" />
                    <span className="text-sm font-medium text-slate-700">Export as PDF</span>
                  </button>
                </div>
              )}
            </div>

            {/* Enhanced Share */}
            <button
              onClick={copyToClipboard}
              className="group flex items-center gap-3 px-4 py-2 rounded-xl border border-white/30 hover:bg-white/60 transition-all duration-300 backdrop-blur-sm hover:shadow-lg hover:scale-105"
            >
              <Share className="w-4 h-4 text-slate-600" />
              <span className="text-sm font-medium text-slate-700">Share</span>
            </button>

            {/* Enhanced Clear Board */}
            <button
              onClick={clearBoard}
              className="group flex items-center gap-3 px-4 py-2 rounded-xl border border-red-200/50 hover:bg-red-50/80 text-red-600 transition-all duration-300 backdrop-blur-sm hover:shadow-lg hover:scale-105"
            >
              <Trash2 className="w-4 h-4" />
              <span className="text-sm font-medium">Clear</span>
            </button>
          </div>
        </div>

        {/* Enhanced Instructions with Glassmorphism */}
        <div className="mt-4 p-4 bg-white/30 backdrop-blur-sm rounded-xl border border-white/20">
          <div className="text-sm text-slate-600 leading-relaxed">
            {mode === MODES.DRAW
              ? selectedTool === 'select' 
                ? (
                  <div className="flex items-center gap-2">
                    <MousePointer className="w-4 h-4 text-blue-500" />
                    <span><strong>Select Mode:</strong> Click and drag to select elements • Double-click sticky notes to edit • Right-click for context menu</span>
                  </div>
                )
                : selectedTool === 'text'
                ? (
                  <div className="flex items-center gap-2">
                    <Type className="w-4 h-4 text-teal-500" />
                    <span><strong>Text Mode:</strong> Click anywhere to create a text box • Double-click to edit text • Use toolbar to format</span>
                  </div>
                )
                : (
                  <div className="flex items-center gap-2">
                    <PenTool className="w-4 h-4 text-purple-500" />
                    <span><strong>Draw Mode:</strong> Click and drag to draw • Use color palette and stroke width controls to customize • Hold Shift for straight lines</span>
                  </div>
                )
              : mode === MODES.HIGHLIGHT
              ? (
                <div className="flex items-center gap-2">
                  <Highlighter className="w-4 h-4 text-yellow-500" />
                  <span><strong>Highlight Mode:</strong> Drag to highlight content • Adjust highlighter color and width • Perfect for marking important areas</span>
                </div>
              )
              : (
                <div className="flex items-center gap-2">
                  <Eraser className="w-4 h-4 text-red-500" />
                  <span><strong>Erase Mode:</strong> Drag to erase lines • Adjust eraser size with the size control • Switch back to pen mode to continue drawing</span>
                </div>
              )
            }
            {isVoiceEnabled && (
              <div className="flex items-center gap-2 mt-2 text-green-600">
                <Mic className="w-4 h-4" />
                <span><strong>Voice Chat Active:</strong> Collaborate in real-time with team members</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Glassmorphism Text Box Toolbar */}
      {selectedBox && (
        <div className="absolute top-36 left-1/2 transform -translate-x-1/2 bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/30 p-4 flex items-center gap-4 z-20 min-w-[400px]">
          <div className="flex items-center gap-2 border-r border-white/30 pr-4">
            <button
              onClick={toggleBold}
              className={`group p-3 rounded-xl hover:scale-105 transition-all duration-300 ${
                selectedBoxData?.style.fontWeight === 'bold' 
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/25' 
                  : 'hover:bg-white/60 text-slate-700 border border-white/20'
              }`}
              title="Bold"
            >
              <Bold className="w-4 h-4" />
            </button>
            <button
              onClick={toggleItalic}
              className={`group p-3 rounded-xl hover:scale-105 transition-all duration-300 ${
                selectedBoxData?.style.fontStyle === 'italic' 
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/25' 
                  : 'hover:bg-white/60 text-slate-700 border border-white/20'
              }`}
              title="Italic"
            >
              <Italic className="w-4 h-4" />
            </button>
            <button
              onClick={toggleUnderline}
              className={`group p-3 rounded-xl hover:scale-105 transition-all duration-300 ${
                selectedBoxData?.style.textDecoration === 'underline' 
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/25' 
                  : 'hover:bg-white/60 text-slate-700 border border-white/20'
              }`}
              title="Underline"
            >
              <Underline className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex items-center gap-2 border-r border-white/30 pr-4">
            <button
              onClick={() => updateStyle('textAlign', 'left')}
              className={`group p-3 rounded-xl hover:scale-105 transition-all duration-300 ${
                selectedBoxData?.style.textAlign === 'left' 
                  ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg shadow-teal-500/25' 
                  : 'hover:bg-white/60 text-slate-700 border border-white/20'
              }`}
              title="Align Left"
            >
              <AlignLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => updateStyle('textAlign', 'center')}
              className={`group p-3 rounded-xl hover:scale-105 transition-all duration-300 ${
                selectedBoxData?.style.textAlign === 'center' 
                  ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg shadow-teal-500/25' 
                  : 'hover:bg-white/60 text-slate-700 border border-white/20'
              }`}
              title="Align Center"
            >
              <AlignCenter className="w-4 h-4" />
            </button>
            <button
              onClick={() => updateStyle('textAlign', 'right')}
              className={`group p-3 rounded-xl hover:scale-105 transition-all duration-300 ${
                selectedBoxData?.style.textAlign === 'right' 
                  ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg shadow-teal-500/25' 
                  : 'hover:bg-white/60 text-slate-700 border border-white/20'
              }`}
              title="Align Right"
            >
              <AlignRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={selectedBoxData?.style.fontSize || 16}
              onChange={(e) => updateStyle('fontSize', parseInt(e.target.value))}
              className="px-3 py-2 bg-white/50 backdrop-blur-sm border border-white/30 rounded-xl text-sm font-medium text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300/50"
              title="Font Size"
            >
              <option value={12}>12px</option>
              <option value={14}>14px</option>
              <option value={16}>16px</option>
              <option value={18}>18px</option>
              <option value={24}>24px</option>
              <option value={32}>32px</option>
              <option value={48}>48px</option>
            </select>
            
            <input
              type="color"
              value={selectedBoxData?.style.color || '#000000'}
              onChange={(e) => updateStyle('color', e.target.value)}
              className="w-10 h-10 border border-white/30 rounded-xl cursor-pointer bg-white/50 backdrop-blur-sm"
              title="Text Color"
            />
          </div>
        </div>
      )}

      {/* Enhanced Voice Debug Panel with Glassmorphism */}
      {(voiceError || voiceDebug.length > 0) && (
        <div className="px-6 py-3 bg-yellow-500/10 backdrop-blur-sm border-b border-yellow-200/30">
          {voiceError && (
            <div className="flex items-center gap-3 text-red-700 mb-2 p-3 bg-red-50/80 backdrop-blur-sm rounded-xl border border-red-200/50">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm font-medium flex-1">Voice Error: {voiceError}</span>
              <button
                onClick={() => {
                  setVoiceError(null);
                  initializeVoiceChat();
                }}
                className="text-xs text-red-600 hover:text-red-800 px-3 py-1 bg-white/50 rounded-lg hover:bg-white/70 transition-colors font-medium"
              >
                Retry
              </button>
            </div>
          )}
          {voiceDebug.length > 0 && (
            <div className="max-h-20 overflow-y-auto bg-white/30 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              {voiceDebug.map((debug, index) => (
                <div key={index} className="text-xs text-slate-600 font-mono mb-1 last:mb-0">
                  {debug}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Enhanced Canvas with Glassmorphism Effects */}
      <div className="flex-1 overflow-hidden relative">
        {/* Canvas Container with Enhanced Styling */}
        <div 
          id="whiteboard-stage" 
          className="relative h-full w-full shadow-inner"
          style={{ 
            backgroundColor: backgroundColor,
            backgroundImage: backgroundColor === '#ffffff' 
              ? `radial-gradient(circle at 1px 1px, rgba(59, 130, 246, 0.15) 1px, transparent 0)`
              : `radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.1) 1px, transparent 0)`,
            backgroundSize: '20px 20px'
          }}
          onClick={handleCanvasClick}
        >
          <Stage
            ref={stageRef}
            width={window.innerWidth}
            height={window.innerHeight - 200}
            scaleX={zoom}
            scaleY={zoom}
            x={panOffset.x}
            y={panOffset.y}
            onMouseDown={selectedTool === 'text' ? undefined : handleMouseDown}
            onMousemove={selectedTool === 'text' ? undefined : handleMouseMove}
            onMouseup={selectedTool === 'text' ? undefined : handleMouseUp}
            style={{ 
              cursor: mode === MODES.ERASE ? "crosshair" : mode === MODES.HIGHLIGHT ? "crosshair" : selectedTool === 'pen' ? "crosshair" : selectedTool === 'text' ? "text" : "default"
            }}
          >
            <Layer ref={layerRef}>
              {/* Enhanced Grid Background */}
              {showGrid && (
                <>
                  {Array.from({ length: Math.ceil(window.innerWidth / (20 * zoom)) + 1 }).map((_, i) => (
                    <Line
                      key={`vertical-${i}`}
                      points={[i * 20, 0, i * 20, window.innerHeight]}
                      stroke={backgroundColor === '#ffffff' ? '#f1f5f9' : '#374151'}
                      strokeWidth={1 / zoom}
                      opacity={0.5}
                      listening={false}
                    />
                  ))}
                  {Array.from({ length: Math.ceil(window.innerHeight / (20 * zoom)) + 1 }).map((_, i) => (
                    <Line
                      key={`horizontal-${i}`}
                      points={[0, i * 20, window.innerWidth, i * 20]}
                      stroke={backgroundColor === '#ffffff' ? '#f1f5f9' : '#374151'}
                      strokeWidth={1 / zoom}
                      opacity={0.5}
                      listening={false}
                    />
                  ))}
                </>
              )}

              {/* Render template-specific components */}
              {renderTemplateComponents()}
              
              {/* Enhanced drawing lines */}
              {lines.map((line, index) => (
                <Line
                  key={index}
                  points={line.points}
                  stroke={line.color || "#1f2937"}
                  strokeWidth={line.strokeWidth || 3}
                  tension={0.5}
                  lineCap={line.isHighlight ? "round" : "round"}
                  lineJoin="round"
                  globalCompositeOperation={line.isHighlight ? "multiply" : "source-over"}
                  opacity={line.opacity || 1.0}
                  shadowColor={line.isHighlight ? "transparent" : "rgba(0,0,0,0.1)"}
                  shadowBlur={line.isHighlight ? 0 : 1}
                  shadowOffset={line.isHighlight ? { x: 0, y: 0 } : { x: 1, y: 1 }}
                />
              ))}

              {/* Eraser Cursor Visual */}
              {mode === MODES.ERASE && (
                <>
                  <Circle
                    x={eraserPos.x}
                    y={eraserPos.y}
                    radius={eraserSize / 2}
                    fill="rgba(239, 68, 68, 0.1)"
                    stroke="#ef4444"
                    strokeWidth={2}
                    listening={false}
                    dash={[5, 5]}
                  />
                  <Circle
                    x={eraserPos.x}
                    y={eraserPos.y}
                    radius={2}
                    fill="#ef4444"
                    listening={false}
                  />
                </>
              )}

              {/* Enhanced sticky notes */}
              {notes.map((note) => (
                <React.Fragment key={note.id}>
                  <Rect
                    x={note.x}
                    y={note.y}
                    width={note.width || 180}
                    height={note.height || 120}
                    fill={note.color || "#fef08a"}
                    stroke="#eab308"
                    strokeWidth={1}
                    cornerRadius={8}
                    shadowColor="rgba(0,0,0,0.15)"
                    shadowOffset={{ x: 3, y: 3 }}
                    shadowBlur={6}
                    draggable
                    onDragMove={(e) => handleNoteDrag(note.id, e)}
                    onDblClick={() => {
                      const newText = prompt("Edit note:", note.text);
                      if (newText !== null) {
                        handleNoteChange(note.id, newText);
                      }
                    }}
                    onContextMenu={(e) => {
                      e.evt.preventDefault();
                      if (window.confirm('Delete this note?')) {
                        deleteNote(note.id);
                      }
                    }}
                  />
                  <Text
                    x={note.x + 12}
                    y={note.y + 12}
                    text={note.text}
                    fontSize={note.fontSize || 14}
                    fontFamily="Inter, -apple-system, BlinkMacSystemFont, sans-serif"
                    fill="#92400e"
                    width={(note.width || 180) - 24}
                    height={(note.height || 120) - 24}
                    verticalAlign="top"
                    wrap="word"
                    draggable
                    onDragMove={(e) => handleNoteDrag(note.id, e)}
                    onDblClick={() => {
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

          {/* Enhanced Glassmorphism Text Boxes */}
          {textBoxes.map((box) => (
            <div
              key={box.id}
              className={`text-box absolute select-none transition-all duration-300 group ${
                selectedBox === box.id 
                  ? 'ring-2 ring-blue-400/60 shadow-2xl shadow-blue-500/20 scale-105' 
                  : 'shadow-lg hover:shadow-xl hover:scale-102'
              } ${
                isEditing === box.id 
                  ? 'ring-2 ring-blue-500/70 shadow-2xl shadow-blue-500/30 scale-105' 
                  : ''
              }`}
              style={{
                left: box.x,
                top: box.y,
                minWidth: '120px',
                maxWidth: '400px',
                minHeight: '35px',
                cursor: isEditing === box.id ? 'text' : 'move',
                zIndex: 10,
                borderRadius: '16px',
                background: selectedBox === box.id || isEditing === box.id
                  ? 'rgba(255, 255, 255, 0.95)'
                  : 'rgba(255, 255, 255, 0.85)',
                border: selectedBox === box.id || isEditing === box.id
                  ? '1px solid rgba(59, 130, 246, 0.3)'
                  : '1px solid rgba(255, 255, 255, 0.3)',
                backdropFilter: 'blur(12px)',
                boxShadow: selectedBox === box.id || isEditing === box.id
                  ? '0 20px 25px -5px rgba(59, 130, 246, 0.1), 0 10px 10px -5px rgba(59, 130, 246, 0.04)'
                  : '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              }}
              onMouseDown={(e) => handleTextMouseDown(e, box.id)}
              onDoubleClick={() => handleDoubleClick(box.id)}
            >
              {isEditing === box.id ? (
                <textarea
                  ref={textAreaRef}
                  value={box.text}
                  onChange={handleTextChange}
                  onBlur={handleTextBlur}
                  onKeyDown={handleKeyDown}
                  className="w-full resize-none border-none outline-none bg-transparent overflow-hidden rounded-2xl focus:ring-0"
                  style={{
                    fontSize: box.style.fontSize,
                    fontWeight: box.style.fontWeight,
                    fontStyle: box.style.fontStyle,
                    textDecoration: box.style.textDecoration,
                    textAlign: box.style.textAlign,
                    color: box.style.color,
                    backgroundColor: 'transparent',
                    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
                    lineHeight: '1.6',
                    padding: '12px 16px',
                    minHeight: '35px',
                    height: 'auto'
                  }}
                  onInput={(e) => {
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.max(35, e.target.scrollHeight) + 'px';
                  }}
                />
              ) : (
                <div
                  className="px-4 py-3 whitespace-pre-wrap break-words rounded-2xl group-hover:bg-white/10 transition-colors duration-300"
                  style={{
                    fontSize: box.style.fontSize,
                    fontWeight: box.style.fontWeight,
                    fontStyle: box.style.fontStyle,
                    textDecoration: box.style.textDecoration,
                    textAlign: box.style.textAlign,
                    color: box.style.color,
                    backgroundColor: 'transparent',
                    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
                    lineHeight: '1.6',
                    minHeight: '35px',
                    width: 'max-content',
                  }}
                >
                  {box.text}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}