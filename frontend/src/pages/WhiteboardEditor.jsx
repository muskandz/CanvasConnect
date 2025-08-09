import React, { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { Stage, Layer, Line, Rect, Text, Circle } from "react-konva"; // Added Circle for eraser cursor
import Konva from "konva";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { v4 as uuidv4 } from 'uuid';
import { io } from "socket.io-client";
import { API_CONFIG } from "../config/api";
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

// Use shared API config and the global socket instance when available
const API_BASE_URL = API_CONFIG.BASE_URL;
const socket = (typeof window !== 'undefined' && window.socket)
  ? window.socket
  : io(API_CONFIG.SOCKET_URL);
if (typeof window !== 'undefined') window.socket = socket;

const MODES = { DRAW: "draw", ERASE: "erase", HIGHLIGHT: "highlight" };

// Debounce utility for performance optimization
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Line smoothing utilities for ultra-smooth drawing experience
const getDistance = (p1, p2) => {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
};

const getAveragePoint = (p1, p2) => {
  return {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2
  };
};

// Advanced cubic bezier smoothing for ultra-smooth lines
const getCubicBezierPoints = (points, smoothness = 0.4) => {
  if (points.length < 6) return points;
  
  const smoothPoints = [];
  smoothPoints.push(points[0], points[1]); // Start point
  
  for (let i = 2; i < points.length - 4; i += 2) {
    const p0x = points[i - 2] || points[i];
    const p0y = points[i - 1] || points[i + 1];
    const p1x = points[i];
    const p1y = points[i + 1];
    const p2x = points[i + 2];
    const p2y = points[i + 3];
    const p3x = points[i + 4] || p2x;
    const p3y = points[i + 5] || p2y;
    
    // Calculate control points for cubic bezier
    const cp1x = p1x + (p2x - p0x) * smoothness;
    const cp1y = p1y + (p2y - p0y) * smoothness;
    const cp2x = p2x - (p3x - p1x) * smoothness;
    const cp2y = p2y - (p3y - p1y) * smoothness;
    
    // Generate multiple points along the curve for ultra-smooth appearance
    for (let t = 0; t <= 1; t += 0.1) {
      const x = Math.pow(1 - t, 3) * p1x + 
                3 * Math.pow(1 - t, 2) * t * cp1x + 
                3 * (1 - t) * Math.pow(t, 2) * cp2x + 
                Math.pow(t, 3) * p2x;
      const y = Math.pow(1 - t, 3) * p1y + 
                3 * Math.pow(1 - t, 2) * t * cp1y + 
                3 * (1 - t) * Math.pow(t, 2) * cp2y + 
                Math.pow(t, 3) * p2y;
      
      if (t > 0) { // Skip first point to avoid duplication
        smoothPoints.push(x, y);
      }
    }
  }
  
  // Add the last point
  smoothPoints.push(points[points.length - 2], points[points.length - 1]);
  return smoothPoints;
};

const getSmoothPoints = (points, smoothing = 0.3) => {
  if (points.length < 6) return points; // Need at least 3 points for smoothing
  
  const smoothPoints = [];
  smoothPoints.push(points[0], points[1]); // Keep first point as is
  
  for (let i = 2; i < points.length - 2; i += 2) {
    const prevX = points[i - 2];
    const prevY = points[i - 1];
    const currX = points[i];
    const currY = points[i + 1];
    const nextX = points[i + 2];
    const nextY = points[i + 3];
    
    // Apply quadratic smoothing
    const smoothX = currX + (prevX + nextX - 2 * currX) * smoothing;
    const smoothY = currY + (prevY + nextY - 2 * currY) * smoothing;
    
    smoothPoints.push(smoothX, smoothY);
  }
  
  // Keep last point as is
  smoothPoints.push(points[points.length - 2], points[points.length - 1]);
  return smoothPoints;
};

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
  const [stageSize, setStageSize] = useState({ width: typeof window !== 'undefined' ? window.innerWidth : 1280, height: typeof window !== 'undefined' ? Math.max(300, window.innerHeight - 220) : 720 });
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved', 'saving', 'error'
  const layerRef = useRef(null);
  const stageRef = useRef(null);
  const headerRef = useRef(null);
  const toolbarRef = useRef(null);
  // Imperative drawing/pan/zoom performance refs
  const activeLineRef = useRef(null); // Konva.Line during an active stroke
  const isStrokeActiveRef = useRef(false);
  const currentStrokeIdRef = useRef(null);
  const lastPointerRef = useRef({ x: 0, y: 0, t: 0 });
  const pinchRef = useRef({
    initialDist: 0,
    initialScale: 1,
    center: { x: 0, y: 0 },
    stagePos: { x: 0, y: 0 }
  });
  const inertiaRef = useRef({ vx: 0, vy: 0, lastTime: 0, raf: null });
  const [isVoiceConnected, setIsVoiceConnected] = useState(false);
  const [showAudioTest, setShowAudioTest] = useState(false);
  const [textBoxes, setTextBoxes] = useState([]);
  const [selectedBox, setSelectedBox] = useState(null);
  const [isEditing, setIsEditing] = useState(null);
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editingNoteValue, setEditingNoteValue] = useState("");
  const [dragState, setDragState] = useState({ isDragging: false, offset: { x: 0, y: 0 } });
  const [resizeState, setResizeState] = useState({ isResizing: false, boxId: null, startX: 0, startY: 0, startW: 0, startH: 0 });
  const canvasRef = useRef(null);
  const textAreaRef = useRef(null);
  const lastTouchRef = useRef([]);
  // Gate initial board load to avoid wiping in-progress strokes if server re-emits state
  const initialBoardLoadedRef = useRef(false);
  const [isToolbarOpen, setIsToolbarOpen] = useState(true);

  // Dropdown trigger refs (for portal positioning)
  const colorTriggerRef = useRef(null);
  const strokeTriggerRef = useRef(null);
  const eraserTriggerRef = useRef(null);
  const highlighterTriggerRef = useRef(null);
  const backgroundTriggerRef = useRef(null);
  const exportTriggerRef = useRef(null);
  // Helper to close all dropdowns
  const closeAllDropdowns = useCallback(() => {
    setShowColorPalette(false);
    setShowStrokeWidthPanel(false);
    setShowEraserSizePanel(false);
    setShowHighlighterPanel(false);
    setShowBackgroundPanel(false);
    setShowExportPanel(false);
  }, []);


  // Simple Portal component for dropdowns
  const DropdownPortal = ({ open, anchorRef, align = 'left', offset = 12, children, minWidth }) => {
    const [, setTick] = useState(0);
    const [style, setStyle] = useState({});

    const updatePosition = useCallback(() => {
      const anchor = anchorRef?.current;
      if (!anchor) return;
      const rect = anchor.getBoundingClientRect();
      const top = rect.bottom + offset;
      const left = align === 'right' ? undefined : rect.left;
      const right = align === 'right' ? (window.innerWidth - rect.right) : undefined;
      setStyle({ position: 'fixed', top, left, right, zIndex: 100000, minWidth });
    }, [anchorRef, align, offset, minWidth]);

    useEffect(() => {
      if (!open) return;
      updatePosition();
      const onScroll = () => { updatePosition(); setTick((t) => t + 1); };
      const onResize = () => { updatePosition(); setTick((t) => t + 1); };
      window.addEventListener('scroll', onScroll, true);
      window.addEventListener('resize', onResize);
      return () => {
        window.removeEventListener('scroll', onScroll, true);
        window.removeEventListener('resize', onResize);
      };
    }, [open, updatePosition]);

    if (!open) return null;
    return createPortal(
      <div className="dropdown-panel" style={style}>
        {children}
      </div>,
      document.body
    );
  };

  // Collapse tools by default on small screens
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setIsToolbarOpen(false);
    }
  }, []);

  // Finite world size to avoid endless scrolling
  const WORLD_SIZE = useRef({ width: 8000, height: 6000 });

  // Clamp panOffset so the world stays within view (center if world smaller than viewport at current zoom)
  const clampPan = useCallback((x, y, z) => {
    const worldW = WORLD_SIZE.current.width * z;
    const worldH = WORLD_SIZE.current.height * z;
    const viewW = stageSize.width;
    const viewH = stageSize.height;
    let nx = x;
    let ny = y;
    // If world smaller than viewport on an axis, center it
    if (worldW <= viewW) {
      nx = (viewW - worldW) / 2;
    } else {
      const minX = viewW - worldW; // most left
      const maxX = 0;              // most right
      nx = Math.max(minX, Math.min(maxX, nx));
    }
    if (worldH <= viewH) {
      ny = (viewH - worldH) / 2;
    } else {
      const minY = viewH - worldH;
      const maxY = 0;
      ny = Math.max(minY, Math.min(maxY, ny));
    }
    return { x: nx, y: ny };
  }, [stageSize.width, stageSize.height]);
  
  // Drawing performance optimization refs
  const drawingBufferRef = useRef([]);
  const lastDrawTimeRef = useRef(0);
  const animationFrameRef = useRef(null);

  // Helpers: device detection and math
  const isMobile = useMemo(() => typeof navigator !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent), []);

  const dist = (p1, p2) => Math.hypot(p2.x - p1.x, p2.y - p1.y);
  const getTouches = (evt) => Array.from(evt.touches || []);
  const getTouchPoint = (stage) => stage.getPointerPosition();

  // Inertia panning animation
  const startInertia = useCallback(() => {
    const step = () => {
      // Apply friction-driven velocity to panOffset state
      const friction = 0.92;
      const { vx, vy } = inertiaRef.current;
      setPanOffset((prev) => {
        const cand = { x: prev.x + vx, y: prev.y + vy };
        const clamped = clampPan(cand.x, cand.y, zoom);
        // If clamped changed the position (hit boundary), bleed velocity faster
        if (Math.abs(clamped.x - cand.x) > 0.5) inertiaRef.current.vx *= 0.5;
        if (Math.abs(clamped.y - cand.y) > 0.5) inertiaRef.current.vy *= 0.5;
        return clamped;
      });
      inertiaRef.current.vx *= friction;
      inertiaRef.current.vy *= friction;
      if (Math.abs(inertiaRef.current.vx) > 0.2 || Math.abs(inertiaRef.current.vy) > 0.2) {
        inertiaRef.current.raf = requestAnimationFrame(step);
      } else {
        inertiaRef.current.vx = 0;
        inertiaRef.current.vy = 0;
        inertiaRef.current.lastTime = 0;
        inertiaRef.current.raf = null;
      }
    };
    if (inertiaRef.current.raf) cancelAnimationFrame(inertiaRef.current.raf);
    inertiaRef.current.raf = requestAnimationFrame(step);
  }, [clampPan, zoom]);

  // Begin an imperative stroke (no React state updates during stroke)
  const beginStroke = useCallback((x, y, opts) => {
    const layer = layerRef.current;
    if (!layer) return;
    const nodeLayer = layer; // react-konva forwards Konva node directly on ref
    const line = new Konva.Line({
      points: [x, y],
      stroke: opts.color,
      strokeWidth: opts.width,
      lineCap: 'round',
      lineJoin: 'round',
      opacity: opts.opacity ?? 1,
      globalCompositeOperation: opts.gco || 'source-over',
      tension: 0.25, // subtle smoothing
      perfectDrawEnabled: false,
      shadowForStrokeEnabled: false,
      listening: false
    });
    nodeLayer.add(line);
    nodeLayer.batchDraw();
    activeLineRef.current = line;
    isStrokeActiveRef.current = true;
  }, []);

  const extendStroke = useCallback((x, y, emit, roomId) => {
    const line = activeLineRef.current;
    const stage = stageRef.current;
    if (!line || !stage) return;
    const points = line.points();
    const lastX = points[points.length - 2];
    const lastY = points[points.length - 1];
    // Low-pass filter: add point only if moved enough
    const dx = x - lastX; const dy = y - lastY;
    if (dx * dx + dy * dy < 2.5) return; // ~1.58px
    line.points(points.concat([x, y]));
    // Slight smoothing by adjusting tension
    line.tension(0.3);
    // Draw efficiently
    stage.batchDraw();
    // Network (throttled by caller)
    if (emit) emit({ id: uuidv4(), points: line.points(), color: line.stroke(), strokeWidth: line.strokeWidth(), opacity: line.opacity(), globalCompositeOperation: line.globalCompositeOperation() });
  }, []);

  const endStroke = useCallback(() => {
    if (!isStrokeActiveRef.current || !activeLineRef.current) return;
    const line = activeLineRef.current;
    // Snapshot props before destroying the temp node
    const committedId = currentStrokeIdRef.current || uuidv4();
    const pts = line.points();
    const col = line.stroke();
    const sw = line.strokeWidth();
    const op = line.opacity();
    const gco = line.globalCompositeOperation();
    // Remove temporary Konva node to avoid duplicate rendering
    line.destroy();
    isStrokeActiveRef.current = false;
    activeLineRef.current = null;
    currentStrokeIdRef.current = null;
    // Commit once to React state for persistence
    const committed = {
      id: committedId,
      points: pts,
      color: col,
      strokeWidth: sw,
      opacity: op,
      isHighlight: gco === 'multiply',
      globalCompositeOperation: gco
    };
    setLines((prev) => [...prev, committed]);
    // Broadcast once per stroke to avoid flooding remote clients
    try {
      socket.emit('drawing', { room: id, line: committed });
    } catch (_) {
      // no-op
    }
  }, []);

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
      height: 120
    };
    console.log("Creating new text box:", newBox);
    setTextBoxes([...textBoxes, newBox]);
    setSelectedBox(newBox.id);
    
    // Force immediate save after creating text box
    setTimeout(() => {
      console.log("Force saving after text box creation");
      axios.put(`${API_BASE_URL}/api/boards/update`, {
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
  // Close any open dropdowns when clicking canvas container
  closeAllDropdowns();
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
      axios.put(`${API_BASE_URL}/api/boards/update`, {
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

  // Touch start for dragging text boxes (mobile)
  const handleTextTouchStart = (e, boxId) => {
    if (isEditing) return;
    const touch = e.touches && e.touches[0];
    if (!touch) return;
    const box = textBoxes.find(b => b.id === boxId);
    if (!box) return;
    const canvasContainer = document.getElementById('whiteboard-stage');
    if (!canvasContainer) return;
    const canvasRect = canvasContainer.getBoundingClientRect();

    setSelectedBox(boxId);
    setDragState({
      isDragging: true,
      offset: {
        x: touch.clientX - canvasRect.left - box.x,
        y: touch.clientY - canvasRect.top - box.y
      }
    });
    // Prevent page scroll while starting drag
    e.preventDefault();
    e.stopPropagation();
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

  // Touch move for dragging
  const handleTextTouchMove = (e) => {
    if (!dragState.isDragging || !selectedBox) return;
    const touch = e.touches && e.touches[0];
    if (!touch) return;
    const canvasContainer = document.getElementById('whiteboard-stage');
    if (!canvasContainer) return;
    const rect = canvasContainer.getBoundingClientRect();
    const newX = touch.clientX - rect.left - dragState.offset.x;
    const newY = touch.clientY - rect.top - dragState.offset.y;

    setTextBoxes(boxes => 
      boxes.map(box => 
        box.id === selectedBox
          ? { ...box, x: Math.max(0, newX), y: Math.max(0, newY) }
          : box
      )
    );
    // Avoid scrolling while dragging
    e.preventDefault();
    e.stopPropagation();
  };

  const handleTextTouchEnd = () => {
    setDragState({ isDragging: false, offset: { x: 0, y: 0 } });
  };

  const startResize = (e, boxId) => {
    e.stopPropagation();
    e.preventDefault();
    const box = textBoxes.find(b => b.id === boxId);
    if (!box) return;
    setResizeState({
      isResizing: true,
      boxId,
      startX: e.clientX,
      startY: e.clientY,
      startW: box.width || 200,
      startH: typeof box.height === 'number' ? box.height : 120
    });
  };

  const startResizeTouch = (e, boxId) => {
    const touch = e.touches && e.touches[0];
    if (!touch) return;
    e.stopPropagation();
    e.preventDefault();
    const box = textBoxes.find(b => b.id === boxId);
    if (!box) return;
    setResizeState({
      isResizing: true,
      boxId,
      startX: touch.clientX,
      startY: touch.clientY,
      startW: box.width || 200,
      startH: typeof box.height === 'number' ? box.height : 120
    });
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
      if (e.key === 'Escape') {
        setShowColorPalette(false);
        setShowStrokeWidthPanel(false);
        setShowEraserSizePanel(false);
        setShowHighlighterPanel(false);
        setShowBackgroundPanel(false);
        setShowExportPanel(false);
      }
    };

    const handleGlobalMouseMove = (e) => {
      if (dragState.isDragging && selectedBox) {
        handleTextMouseMove(e);
      }
      if (resizeState.isResizing && resizeState.boxId) {
        const dx = e.clientX - resizeState.startX;
        const dy = e.clientY - resizeState.startY;
        const minW = 120;
        const minH = 35;
        const newW = Math.max(minW, resizeState.startW + dx);
        const newH = Math.max(minH, resizeState.startH + dy);
        setTextBoxes((boxes) => boxes.map((b) => b.id === resizeState.boxId ? { ...b, width: newW, height: newH } : b));
      }
    };

    const handleGlobalMouseUp = () => {
      if (dragState.isDragging) {
        handleTextMouseUp();
      }
      if (resizeState.isResizing) {
        setResizeState({ isResizing: false, boxId: null, startX: 0, startY: 0, startW: 0, startH: 0 });
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);
    // Touch listeners for mobile drag/resize
    const handleGlobalTouchMove = (e) => {
      const touch = e.touches && e.touches[0];
      if (!touch) return;
      if (dragState.isDragging && selectedBox) {
        handleTextTouchMove(e);
      }
      if (resizeState.isResizing && resizeState.boxId) {
        const dx = touch.clientX - resizeState.startX;
        const dy = touch.clientY - resizeState.startY;
        const minW = 120;
        const minH = 35;
        const newW = Math.max(minW, resizeState.startW + dx);
        const newH = Math.max(minH, resizeState.startH + dy);
        setTextBoxes((boxes) => boxes.map((b) => b.id === resizeState.boxId ? { ...b, width: newW, height: newH } : b));
        e.preventDefault();
      }
    };
    const handleGlobalTouchEnd = () => {
      if (dragState.isDragging) {
        handleTextTouchEnd();
      }
      if (resizeState.isResizing) {
        setResizeState({ isResizing: false, boxId: null, startX: 0, startY: 0, startW: 0, startH: 0 });
      }
    };
    document.addEventListener('touchmove', handleGlobalTouchMove, { passive: false });
    document.addEventListener('touchend', handleGlobalTouchEnd);
    
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
      document.removeEventListener('mousemove', handleGlobalMouseMove);
  document.removeEventListener('mouseup', handleGlobalMouseUp);
  document.removeEventListener('touchmove', handleGlobalTouchMove);
  document.removeEventListener('touchend', handleGlobalTouchEnd);
    };
  }, [selectedBox, isEditing, dragState.isDragging, resizeState.isResizing, resizeState.boxId]);

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
    axios.get(`${API_BASE_URL}/api/health`)
      .then(response => {
        console.log("Backend server info:", response.data);
      })
      .catch(error => {
        console.error("Health check failed:", error);
      });
      
    const fetchBoardData = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/boards/${id}`);
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
        axios.put(`${API_BASE_URL}/api/boards/update`, {
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
        // Apply initial load only once to prevent overwriting active local drawing
        if (!initialBoardLoadedRef.current) {
          if (data?.lines) setLines(data.lines);
          if (data?.notes) setNotes(data.notes);
          initialBoardLoadedRef.current = true;
        }
      });
  
      return () => {
        socket.emit('leave', { room: id });
        socket.off('drawing');
        socket.off('load_board_state');
      };
    }
  }, [id]);  

  // Cleanup effect for drawing performance optimization
  useEffect(() => {
    return () => {
      // Cleanup animation frames and buffers on unmount
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      drawingBufferRef.current = [];
    };
  }, []);  

  // Respond to window resize for Stage sizing and pan clamping
  useEffect(() => {
    const onResize = () => {
      const hh = headerRef.current?.offsetHeight || 0;
      const th = isToolbarOpen ? (toolbarRef.current?.offsetHeight || 0) : 0;
      const next = { width: window.innerWidth, height: Math.max(300, window.innerHeight - (hh + th)) };
      setStageSize(next);
      setPanOffset(curr => clampPan(curr.x, curr.y, zoom));
    };
    window.addEventListener('resize', onResize);
    // run once
    onResize();
    return () => window.removeEventListener('resize', onResize);
  }, [clampPan, zoom, isToolbarOpen]);
  
  // Initial compute after mount (once refs have layout)
  useEffect(() => {
    const hh = headerRef.current?.offsetHeight || 0;
    const th = isToolbarOpen ? (toolbarRef.current?.offsetHeight || 0) : 0;
    setStageSize({ width: window.innerWidth, height: Math.max(300, window.innerHeight - (hh + th)) });
    setPanOffset(curr => clampPan(curr.x, curr.y, zoom));
  }, [isToolbarOpen]);



  const handleSave = async () => {
    try {
      console.log("Manual save with textBoxes:", textBoxes);
      setSaveStatus('saving');
      await axios.put(`${API_BASE_URL}/api/boards/update`, {
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

  // Ultra-responsive socket emission for real-time collaboration
  const throttledDrawingEmit = useCallback(
    debounce((line) => {
      socket.emit('drawing', { room: id, line });
    }, 16), // Back to 60fps for ultra-responsive collaboration
    [id]
  );

  const throttledEraseEmit = useCallback(
    debounce((lines) => {
      socket.emit('erase', { room: id, lines });
    }, 33), // 30fps for erase operations
    [id]
  );

  // Enhanced zoom functions
  const handleZoomIn = () => {
    setZoom(prev => {
      const next = Math.min(prev * 1.2, 3);
      setPanOffset(curr => clampPan(curr.x, curr.y, next));
      return next;
    });
  };

  const handleZoomOut = () => {
    setZoom(prev => {
      const next = Math.max(prev / 1.2, 0.2);
      setPanOffset(curr => clampPan(curr.x, curr.y, next));
      return next;
    });
  };

  const resetZoom = () => {
    const next = 1;
    setZoom(next);
    setPanOffset(curr => clampPan(curr.x, curr.y, next));
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

  const bringNoteToFront = (id) => {
    setNotes((prev) => {
      const idx = prev.findIndex((n) => n.id === id);
      if (idx === -1) return prev;
      const arr = prev.slice();
      const [n] = arr.splice(idx, 1);
      arr.push(n);
      return arr;
    });
  };

  const selectNote = (id) => {
    setSelectedNoteId(id);
    bringNoteToFront(id);
  };

  const startNoteEdit = (note) => {
    setEditingNoteId(note.id);
    setEditingNoteValue(note.text || "");
  };

  const commitNoteEdit = () => {
    if (!editingNoteId) return;
    const note = notes.find((n) => n.id === editingNoteId);
    if (!note) {
      setEditingNoteId(null);
      return;
    }
    const newText = editingNoteValue;
    const updated = { ...note, text: newText };
    // Auto-resize height based on content (convert from screen px to world units via zoom)
    try {
      const ta = document.getElementById('note-editor-textarea');
      if (ta) {
        const contentH = Math.max(35, ta.scrollHeight);
        const padding = 24; // matches visual padding
        const worldH = Math.max(80, (contentH + padding) / Math.max(zoom, 0.001));
        updated.height = worldH;
      }
    } catch {}
    setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
    socket.emit('note_updated', { room: id, note: updated });
    setEditingNoteId(null);
  };

  const cancelNoteEdit = () => {
    setEditingNoteId(null);
  };

  // Resize handle drag logic for notes
  const handleNoteResizeDragMove = (noteId, e) => {
    const note = notes.find((n) => n.id === noteId);
    if (!note) return;
    const handleX = e.target.x();
    const handleY = e.target.y();
    const minW = 120;
    const minH = 80;
    const newW = Math.max(minW, handleX - note.x);
    const newH = Math.max(minH, handleY - note.y);
    const updated = { ...note, width: newW, height: newH };
    setNotes((prev) => prev.map((n) => (n.id === noteId ? updated : n)));
  };

  const handleNoteResizeDragEnd = (noteId) => {
    const note = notes.find((n) => n.id === noteId);
    if (!note) return;
    socket.emit('note_updated', { room: id, note });
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

  // Mouse and Touch event handlers for drawing and panning
  const handleMouseDown = (e) => {
  // Close any open dropdowns when starting interaction with the board
  closeAllDropdowns();
    // Clear text box selection when clicking on canvas (unless in text mode)
    if (selectedTool !== 'text') {
      setSelectedBox(null);
    }

    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    if (!point) return;

    // Adjust for pan and zoom
    const adjustedX = (point.x - panOffset.x) / zoom;
    const adjustedY = (point.y - panOffset.y) / zoom;

    // Middle mouse or Ctrl+Click begins panning
    if (e.evt.button === 1 || (e.evt.button === 0 && e.evt.ctrlKey)) {
      setIsPanning(true);
      return;
    }
    // Only respond to primary button for drawing/erasing
    if (e.evt.button !== 0) return;

    if (selectedTool === 'select') {
      return;
    }

    // Eraser
    if (mode === MODES.ERASE) {
      setIsErasing(true);
      setEraserPos({ x: point.x, y: point.y });
      // Use eraser with adjusted coordinates in world space
      eraseAtPosition(adjustedX, adjustedY);
      return;
    }

    // Drawing (pen or highlighter)
    if (selectedTool === 'pen' || mode === MODES.HIGHLIGHT) {
      isDrawing.current = true;
      const isHighlight = mode === MODES.HIGHLIGHT;
      const newLine = {
        points: [adjustedX, adjustedY],
        color: isHighlight ? highlighterColor : strokeColor,
        strokeWidth: isHighlight ? highlighterWidth : strokeWidth,
        isHighlight: isHighlight,
        opacity: isHighlight ? 0.4 : 1.0
      };
      setLines(prev => [...prev, newLine]);
      setRedoStack([]);
    }
  };

  const handleMouseMove = (e) => {
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    if (!point) return;

    // If no primary button, stop panning/drawing
    if ((e.evt.buttons & 1) === 0) {
      if (isPanning) setIsPanning(false);
      if (isDrawing.current) isDrawing.current = false;
    }

    // Panning
    if (isPanning && (e.evt.buttons & 1) === 1) {
      const deltaX = e.evt.movementX;
      const deltaY = e.evt.movementY;
      setPanOffset(prev => {
        const cand = { x: prev.x + deltaX, y: prev.y + deltaY };
        return clampPan(cand.x, cand.y, zoom);
      });
      return;
    }

    // Adjust for pan and zoom
    const adjustedX = (point.x - panOffset.x) / zoom;
    const adjustedY = (point.y - panOffset.y) / zoom;

    // Erasing
    if (mode === MODES.ERASE) {
      setEraserPos({ x: point.x, y: point.y });
      if (isErasing) {
        eraseAtPosition(adjustedX, adjustedY);
      }
      return;
    }

    // Drawing
    if (!isDrawing.current || (mode !== MODES.DRAW && mode !== MODES.HIGHLIGHT) || (selectedTool !== 'pen' && mode !== MODES.HIGHLIGHT)) return;
    setLines((prevLines) => {
      if (prevLines.length === 0) return prevLines;
      const lastLine = { ...prevLines[prevLines.length - 1] };
      lastLine.points = [...lastLine.points, adjustedX, adjustedY];
      // Emit drawing event to other users
      socket.emit('drawing', {
        room: id,
        line: lastLine
      });
      return [...prevLines.slice(0, -1), lastLine];
    });
  };

  // Simplified buffer processing - no longer needed for immediate drawing
  const processDrawingBuffer = () => {
    // Legacy function - keeping for compatibility but not actively used
    drawingBufferRef.current = [];
  };

  const handleMouseUp = () => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }
    isDrawing.current = false;
    setIsErasing(false);
  };

  // Touch event handlers (imperative drawing + pinch-zoom + inertia)
  const handleTouchStart = (e) => {
  // Close any open dropdowns on touch start
  closeAllDropdowns();
    // Prevent the browser from scrolling the page
    if (e?.evt?.preventDefault) e.evt.preventDefault();
    const stage = e.target.getStage();
    if (!stage) return;
    const touches = e.evt.touches;
    lastTouchRef.current = Array.from(touches);
    if (touches.length === 2) {
      e.evt.preventDefault();
      setIsPanning(true);
      // Initialize pinch gesture
      const t1 = touches[0];
      const t2 = touches[1];
      const cx = (t1.clientX + t2.clientX) / 2;
      const cy = (t1.clientY + t2.clientY) / 2;
      pinchRef.current = {
        initialDist: Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY),
        initialScale: zoom,
        center: { x: cx, y: cy },
        stagePos: { x: panOffset.x, y: panOffset.y }
      };
      // cancel any inertia in progress
      if (inertiaRef.current.raf) {
        cancelAnimationFrame(inertiaRef.current.raf);
        inertiaRef.current.raf = null;
      }
      inertiaRef.current.vx = 0; inertiaRef.current.vy = 0; inertiaRef.current.lastTime = 0;
      return;
    }

    // One-finger: draw or erase
    const point = stage.getPointerPosition();
    if (!point) return;
    const adjustedX = (point.x - panOffset.x) / zoom;
    const adjustedY = (point.y - panOffset.y) / zoom;

    if (mode === MODES.ERASE) {
      isDrawing.current = false;
      setIsErasing(true);
      const newLines = lines.filter(line => {
        const lineDistance = getDistanceToLine(adjustedX, adjustedY, line.points);
        return lineDistance > eraserSize / 2;
      });
      if (newLines.length !== lines.length) {
        setLines(newLines);
        socket.emit('erase', { room: id, lines: newLines });
      }
      return;
    }

    // Begin imperative stroke
    isDrawing.current = true;
    const isHighlight = mode === MODES.HIGHLIGHT || selectedTool === 'highlighter';
    const color = isHighlight ? (highlighterColor) : strokeColor;
    const width = isHighlight ? highlighterWidth : strokeWidth;
    const gco = isHighlight ? 'multiply' : 'source-over';
    currentStrokeIdRef.current = uuidv4();
    beginStroke(adjustedX, adjustedY, { color, width, gco, opacity: isHighlight ? 0.5 : 1 });
  };

  const handleTouchMove = (e) => {
    // Prevent the browser from scrolling the page while drawing or panning
    if (e?.evt?.preventDefault) e.evt.preventDefault();
    const stage = e.target.getStage();
    if (!stage) return;
    const touches = e.evt.touches;

    // Pinch / two-finger pan-zoom
    if (isPanning && touches.length === 2) {
      e.evt.preventDefault();
      const t1 = touches[0];
      const t2 = touches[1];
      const cx = (t1.clientX + t2.clientX) / 2;
      const cy = (t1.clientY + t2.clientY) / 2;
      const curDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const initial = pinchRef.current;
      if (!initial.initialDist) return;
      const scaleFactor = curDist / initial.initialDist;
      const newScale = Math.max(0.2, Math.min(3, initial.initialScale * scaleFactor));

      // Combine center translation with zoom anchoring
      const dxCenter = cx - initial.center.x;
      const dyCenter = cy - initial.center.y;
  const tempPos = clampPan(initial.stagePos.x + dxCenter, initial.stagePos.y + dyCenter, initial.initialScale);
      const anchor = {
        x: (cx - tempPos.x) / initial.initialScale,
        y: (cy - tempPos.y) / initial.initialScale,
      };
      const unclampedPos = {
        x: cx - anchor.x * newScale,
        y: cy - anchor.y * newScale,
      };
      const newPos = clampPan(unclampedPos.x, unclampedPos.y, newScale);

      requestAnimationFrame(() => {
        setZoom(newScale);
        setPanOffset(newPos);
      });

      // Track velocity for inertia
  const now = performance.now();
      const last = lastPointerRef.current;
      if (last.t) {
        const dt = Math.max(1, now - last.t);
        inertiaRef.current.vx = (cx - last.x) * 0.9; // pixels per frame approx
        inertiaRef.current.vy = (cy - last.y) * 0.9;
      }
      lastPointerRef.current = { x: cx, y: cy, t: now };
      return;
    }

    // One-finger drawing/erasing
    const point = stage.getPointerPosition();
    if (!point) return;
    const adjustedX = (point.x - panOffset.x) / zoom;
    const adjustedY = (point.y - panOffset.y) / zoom;

    if (isErasing) {
      const newLines = lines.filter(line => {
        const lineDistance = getDistanceToLine(adjustedX, adjustedY, line.points);
        return lineDistance > eraserSize / 2;
      });
      if (newLines.length !== lines.length) {
        setLines(newLines);
        throttledEraseEmit(newLines);
      }
      return;
    }

    if (!isDrawing.current) return;
    if (isStrokeActiveRef.current) {
      extendStroke(adjustedX, adjustedY);
    }
  };

  const handleTouchEnd = (e) => {
    // End pinch with inertia
    if (isPanning) {
      setIsPanning(false);
      // Kick off inertia if there is velocity
      if (Math.abs(inertiaRef.current.vx) > 0.5 || Math.abs(inertiaRef.current.vy) > 0.5) {
        startInertia();
      }
    }
    lastTouchRef.current = [];
    if (isStrokeActiveRef.current) {
      endStroke();
    }
    isDrawing.current = false;
    setIsErasing(false);
  };

  // Wheel event handler for zooming and scrolling
  const handleWheel = (e) => {
    e.evt.preventDefault();
    
    const scaleBy = 1.1;
    const stage = e.target.getStage();
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();

    if (e.evt.ctrlKey || e.evt.metaKey) {
      // Zoom with Ctrl+Wheel (smoother scaling)
      const deltaScale = e.evt.deltaY > 0 ? 1 / scaleBy : scaleBy;
      const newScale = oldScale * deltaScale;
      const clampedScale = Math.max(0.2, Math.min(3, newScale));
      
      // Only update if scale actually changes
  if (Math.abs(clampedScale - oldScale) > 0.001) {
        const mousePointTo = {
          x: (pointer.x - stage.x()) / oldScale,
          y: (pointer.y - stage.y()) / oldScale,
        };

        const newPos = {
          x: pointer.x - mousePointTo.x * clampedScale,
          y: pointer.y - mousePointTo.y * clampedScale,
        };

        // Use requestAnimationFrame for smooth zoom
        requestAnimationFrame(() => {
          setZoom(clampedScale);
          setPanOffset(curr => clampPan(newPos.x, newPos.y, clampedScale));
        });
      }
    } else {
      // Pan with regular wheel (smoother panning)
  const deltaX = e.evt.deltaX || 0;
  const deltaY = e.evt.deltaY || 0;
      
      // Reduce sensitivity for smoother scrolling
      const sensitivity = 0.8;
      const adjustedDeltaX = deltaX * sensitivity;
      const adjustedDeltaY = deltaY * sensitivity;
      
      // Use requestAnimationFrame for smooth panning
      requestAnimationFrame(() => {
        setPanOffset(prev => {
          const cand = { x: prev.x - adjustedDeltaX, y: prev.y - adjustedDeltaY };
          return clampPan(cand.x, cand.y, zoom);
        });
      });
    }
  };

  // Helper function to calculate distance from point to line
  const getDistanceToLine = (px, py, linePoints) => {
    if (linePoints.length < 4) return Infinity;
    
    let minDistance = Infinity;
    for (let i = 0; i < linePoints.length - 2; i += 2) {
      const x1 = linePoints[i];
      const y1 = linePoints[i + 1];
      const x2 = linePoints[i + 2];
      const y2 = linePoints[i + 3];
      
      const distance = getDistancePointToLineSegment(px, py, x1, y1, x2, y2);
      minDistance = Math.min(minDistance, distance);
    }
    
    return minDistance;
  };

  const getDistancePointToLineSegment = (px, py, x1, y1, x2, y2) => {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    
    if (lenSq === 0) return Math.sqrt(A * A + B * B);
    
    let param = dot / lenSq;
    param = Math.max(0, Math.min(1, param));

    const xx = x1 + param * C;
    const yy = y1 + param * D;

    const dx = px - xx;
    const dy = py - yy;
    
    return Math.sqrt(dx * dx + dy * dy);
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
    <div className="h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex flex-col relative z-0 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25px 25px, rgba(59, 130, 246, 0.15) 2px, transparent 0)`,
          backgroundSize: '50px 50px'
        }}></div>
      </div>
      
  {/* Enhanced Glassmorphism Header */}
      <div ref={headerRef} className="relative bg-white/70 backdrop-blur-xl border-b border-white/20 shadow-lg shadow-blue-500/10 px-4 md:px-6 py-3 md:py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
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
                  await axios.put(`${API_BASE_URL}/api/boards/update`, {
                    boardId: id,
                    title: title,
                  });
                } catch (err) {
                  console.error("Failed to update title", err);
                }
              }}
              className="w-full md:w-auto max-w-[80vw] md:max-w-none text-2xl font-bold bg-white/30 backdrop-blur-sm border border-white/20 outline-none focus:bg-white/40 focus:border-blue-300/50 focus:ring-2 focus:ring-blue-500/20 px-3 md:px-4 py-2 rounded-xl transition-all duration-300 placeholder:text-slate-400 text-slate-700"
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

  {/* Mobile Tools Toggle (floating for small screens) */}
      <button
        onClick={() => setIsToolbarOpen((v) => !v)}
        className="md:hidden fixed bottom-20 right-4 z-[80] px-3 py-2 rounded-full shadow-lg shadow-blue-500/10 bg-gradient-to-r from-slate-700 to-slate-900 text-white flex items-center gap-2 active:scale-95"
        aria-label={isToolbarOpen ? 'Hide tools' : 'Show tools'}
      >
        {isToolbarOpen ? <EyeOff className="w-4 h-4" /> : <Settings className="w-4 h-4" />}
        <span className="text-xs font-semibold">Tools</span>
      </button>

  {/* Enhanced Glassmorphism Main Toolbar (collapsible) */}
    {isToolbarOpen && (
  <div ref={toolbarRef} className="relative z-[100000] bg-white/60 backdrop-blur-xl border-b border-white/20 px-3 md:px-6 py-3 md:py-4 shadow-lg shadow-blue-500/5 overflow-x-auto overflow-y-visible md:overflow-x-auto">
  <div className="flex flex-wrap md:flex-nowrap items-center justify-between gap-2 md:gap-3" style={{ WebkitOverflowScrolling: 'touch' }}>
          <div className="flex items-center gap-6 md:shrink-0">
            {/* Enhanced Drawing Tools */}
            <div className="flex flex-wrap md:flex-nowrap items-center gap-2 p-2 bg-white/40 backdrop-blur-sm rounded-2xl border border-white/30 shadow-lg">
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
                    ref={eraserTriggerRef}
                    onClick={() => {
                      setShowColorPalette(false);
                      setShowStrokeWidthPanel(false);
                      setShowHighlighterPanel(false);
                      setShowBackgroundPanel(false);
                      setShowExportPanel(false);
                      setShowEraserSizePanel((v) => !v);
                    }}
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
                  
                  <DropdownPortal open={showEraserSizePanel} anchorRef={eraserTriggerRef} align="left" minWidth={280}>
                    <div className="p-4 bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20">
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
                  </DropdownPortal>
                </div>
              )}

              {/* Enhanced Highlighter Controls */}
              {mode === MODES.HIGHLIGHT && (
                <div className="relative">
                  <button
                    ref={highlighterTriggerRef}
                    onClick={() => {
                      setShowColorPalette(false);
                      setShowStrokeWidthPanel(false);
                      setShowEraserSizePanel(false);
                      setShowBackgroundPanel(false);
                      setShowExportPanel(false);
                      setShowHighlighterPanel((v) => !v);
                    }}
                    className="dropdown-trigger group flex items-center gap-3 px-4 py-2 rounded-xl border border-white/30 hover:bg-white/60 transition-all duration-300 backdrop-blur-sm hover:shadow-lg hover:scale-105"
                  >
                    <div 
                      className="w-8 h-4 rounded-lg border border-white/20 shadow-sm"
                      style={{ backgroundColor: highlighterColor, opacity: 0.7 }}
                    ></div>
                    <span className="text-sm font-medium text-slate-700">{highlighterWidth}px</span>
                  </button>
                  
                  <DropdownPortal open={showHighlighterPanel} anchorRef={highlighterTriggerRef} align="left" minWidth={320}>
                    <div className="p-5 bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20">
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
                  </DropdownPortal>
                </div>
              )}
            </div>

            <div className="h-8 w-px bg-gradient-to-b from-transparent via-slate-300 to-transparent"></div>

            {/* Enhanced Color Picker */}
      <div className="relative">
              <button
                ref={colorTriggerRef}
                onClick={() => {
                  setShowStrokeWidthPanel(false);
                  setShowEraserSizePanel(false);
                  setShowHighlighterPanel(false);
                  setShowBackgroundPanel(false);
                  setShowExportPanel(false);
                  setShowColorPalette((v) => !v);
                }}
        className="dropdown-trigger group flex items-center gap-3 px-4 py-2 rounded-xl border border-white/30 hover:bg-white/60 transition-all duration-300 backdrop-blur-sm hover:shadow-lg hover:scale-105 whitespace-nowrap"
              >
                <Palette className="w-4 h-4 text-slate-600" />
                <div 
                  className="w-8 h-8 rounded-xl border-2 border-white shadow-lg"
                  style={{ backgroundColor: strokeColor }}
                ></div>
              </button>
              
              <DropdownPortal open={showColorPalette} anchorRef={colorTriggerRef} align="left" minWidth={280}>
                <div className="p-5 bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20">
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
              </DropdownPortal>
            </div>

            {/* Enhanced Stroke Width */}
      <div className="relative">
              <button
                ref={strokeTriggerRef}
                onClick={() => {
                  setShowColorPalette(false);
                  setShowEraserSizePanel(false);
                  setShowHighlighterPanel(false);
                  setShowBackgroundPanel(false);
                  setShowExportPanel(false);
                  setShowStrokeWidthPanel((v) => !v);
                }}
        className="dropdown-trigger group flex items-center gap-3 px-4 py-2 rounded-xl border border-white/30 hover:bg-white/60 transition-all duration-300 backdrop-blur-sm hover:shadow-lg hover:scale-105 whitespace-nowrap"
              >
                <div className="flex items-center gap-2">
                  <div 
                    className="rounded-full bg-slate-700 shadow-sm"
                    style={{ width: `${Math.min(strokeWidth * 2, 20)}px`, height: `${Math.min(strokeWidth * 2, 20)}px` }}
                  ></div>
                  <span className="text-sm font-medium text-slate-700">{strokeWidth}px</span>
                </div>
              </button>
              
              <DropdownPortal open={showStrokeWidthPanel} anchorRef={strokeTriggerRef} align="left" minWidth={280}>
                <div className="p-5 bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20">
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
              </DropdownPortal>
            </div>

            <div className="h-8 w-px bg-gradient-to-b from-transparent via-slate-300 to-transparent"></div>

            {/* Enhanced Background Color */}
      <div className="relative">
              <button
                ref={backgroundTriggerRef}
                onClick={() => {
                  setShowColorPalette(false);
                  setShowStrokeWidthPanel(false);
                  setShowEraserSizePanel(false);
                  setShowHighlighterPanel(false);
                  setShowExportPanel(false);
                  setShowBackgroundPanel((v) => !v);
                }}
        className="dropdown-trigger group flex items-center gap-3 px-4 py-2 rounded-xl border border-white/30 hover:bg-white/60 transition-all duration-300 backdrop-blur-sm hover:shadow-lg hover:scale-105 whitespace-nowrap"
              >
                <div 
                  className="w-8 h-8 rounded-xl border-2 border-white/50 shadow-lg"
                  style={{ backgroundColor: backgroundColor }}
                ></div>
                <span className="text-sm font-medium text-slate-700">Background</span>
              </button>
              
              <DropdownPortal open={showBackgroundPanel} anchorRef={backgroundTriggerRef} align="left" minWidth={280}>
                <div className="p-5 bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20">
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
              </DropdownPortal>
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

          <div className="flex items-center gap-4 md:shrink-0">
            {/* Enhanced Zoom Controls */}
            <div className="flex flex-wrap items-center gap-2 p-2 bg-white/40 backdrop-blur-lg rounded-2xl border border-white/30 shadow-lg">
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
            <div className="flex flex-wrap items-center gap-2 p-2 bg-white/40 backdrop-blur-lg rounded-2xl border border-white/30 shadow-lg">
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
                ref={exportTriggerRef}
                onClick={() => {
                  setShowColorPalette(false);
                  setShowStrokeWidthPanel(false);
                  setShowEraserSizePanel(false);
                  setShowHighlighterPanel(false);
                  setShowBackgroundPanel(false);
                  setShowExportPanel((v) => !v);
                }}
        className="dropdown-trigger group flex items-center gap-3 px-4 py-2 rounded-xl border border-white/30 hover:bg-white/60 transition-all duration-300 backdrop-blur-sm hover:shadow-lg hover:scale-105 whitespace-nowrap"
              >
                <Download className="w-4 h-4 text-slate-600" />
                <span className="text-sm font-medium text-slate-700">Export</span>
              </button>
              
              <DropdownPortal open={showExportPanel} anchorRef={exportTriggerRef} align="right" minWidth={200}>
                <div className="p-3 bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20">
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
              </DropdownPortal>
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
      </div>

      )}

  {/* Instructions removed per user request */}

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
  <div className="flex-1 overflow-hidden relative z-0">
        {/* Canvas Container with Enhanced Styling */}
  <div 
          id="whiteboard-stage" 
      className="relative h-full w-full shadow-inner z-0"
          style={{ 
            backgroundColor: backgroundColor,
            backgroundImage: backgroundColor === '#ffffff' 
              ? `radial-gradient(circle at 1px 1px, rgba(59, 130, 246, 0.15) 1px, transparent 0)`
              : `radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.1) 1px, transparent 0)`,
      backgroundSize: '20px 20px',
      overscrollBehavior: 'contain' // keep surrounding UI (toolbar) stable
          }}
          onClick={handleCanvasClick}
        >
          <Stage
            ref={stageRef}
            width={stageSize.width}
            height={stageSize.height}
            scaleX={zoom}
            scaleY={zoom}
            x={panOffset.x}
            y={panOffset.y}
            className="z-0"
            onMouseDown={selectedTool === 'text' ? undefined : handleMouseDown}
            onMouseMove={selectedTool === 'text' ? undefined : handleMouseMove}
            onMouseUp={selectedTool === 'text' ? undefined : handleMouseUp}
            onTouchStart={selectedTool === 'text' ? undefined : handleTouchStart}
            onTouchMove={selectedTool === 'text' ? undefined : handleTouchMove}
            onTouchEnd={selectedTool === 'text' ? undefined : handleTouchEnd}
            onWheel={handleWheel}
            style={{ 
              cursor: mode === MODES.ERASE ? "crosshair" : mode === MODES.HIGHLIGHT ? "crosshair" : selectedTool === 'pen' ? "crosshair" : selectedTool === 'text' ? "text" : "default",
              touchAction: 'none',
              willChange: 'transform',
              transform: 'translateZ(0)', // Force hardware acceleration
              backfaceVisibility: 'hidden'
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
              
              {/* Ultra-optimized drawing lines for maximum performance */}
              {lines.map((line, index) => (
                <Line
                  key={line.id || index}
                  points={line.points}
                  stroke={line.color || line.stroke || "#1f2937"}
                  strokeWidth={line.strokeWidth || 3}
                  tension={0}
                  lineCap="round"
                  lineJoin="round"
                  globalCompositeOperation={line.isHighlight || line.globalCompositeOperation === 'multiply' ? "multiply" : "source-over"}
                  opacity={line.opacity || (line.isHighlight ? 0.5 : 1.0)}
                  perfectDrawEnabled={false}
                  shadowForStrokeEnabled={false}
                  hitStrokeWidth={0}
                  listening={false}
                  transformsEnabled="position"
                  visible={true}
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
                width: box.width || 200,
                maxWidth: '600px',
                minHeight: '35px',
                height: typeof box.height === 'number' ? box.height : 'auto',
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
              onTouchStart={(e) => handleTextTouchStart(e, box.id)}
              onTouchMove={handleTextTouchMove}
              onTouchEnd={handleTextTouchEnd}
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
                    width: '100%',
                  }}
                >
                  {box.text}
                </div>
              )}
              {/* Resize handle (bottom-right) */}
              {isEditing !== box.id && (
                <div
                  onMouseDown={(e) => startResize(e, box.id)}
                  onTouchStart={(e) => startResizeTouch(e, box.id)}
                  title="Resize"
                  className="absolute bottom-1 right-1 w-4 h-4 rounded-md bg-blue-500/80 hover:bg-blue-600 cursor-se-resize shadow ring-2 ring-white"
                  style={{
                    boxShadow: '0 2px 6px rgba(37, 99, 235, 0.35)'
                  }}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}