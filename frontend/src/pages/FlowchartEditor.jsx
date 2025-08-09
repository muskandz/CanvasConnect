import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeft,
  Save,
  MousePointer,
  Grid3X3,
  Square,
  Circle,
  Diamond,
  ArrowRight,
  Trash2
} from 'lucide-react';

function FlowchartEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const svgRef = useRef(null);

  const [flowchart, setFlowchart] = useState({
    title: 'Untitled Flowchart',
    nodes: [
      {
        id: '1',
        type: 'start',
        x: 300,
        y: 100,
        width: 120,
        height: 60,
        text: 'Start',
        color: '#10b981',
        textColor: '#ffffff'
      }
    ],
    connections: [],
    canvasWidth: 1200,
    canvasHeight: 800
  });

  const [isLoading, setIsLoading] = useState(true);
  const [selectedTool, setSelectedTool] = useState('select');
  const [selectedNode, setSelectedNode] = useState(null);
  const [editingNode, setEditingNode] = useState(null);
  const [connecting, setConnecting] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [draggedNode, setDraggedNode] = useState(null);
  const [showGrid, setShowGrid] = useState(true);

  const nodeTypes = {
    start: {
      shape: 'oval',
      color: '#10b981',
      label: 'Start/End',
      icon: Circle,
      defaultText: 'Start'
    },
    process: {
      shape: 'rectangle',
      color: '#3b82f6',
      label: 'Process',
      icon: Square,
      defaultText: 'Process'
    },
    decision: {
      shape: 'diamond',
      color: '#f59e0b',
      label: 'Decision',
      icon: Diamond,
      defaultText: 'Decision?'
    },
    end: {
      shape: 'oval',
      color: '#ef4444',
      label: 'End',
      icon: Circle,
      defaultText: 'End'
    },
    connector: {
      shape: 'circle',
      color: '#6b7280',
      label: 'Connector',
      icon: Circle,
      defaultText: ''
    }
  };

  // Fetch flowchart data
  useEffect(() => {
    const fetchFlowchart = async () => {
      try {
        const response = await axios.get(`/api/boards/${id}`);
        if (response.data.data && Object.keys(response.data.data).length > 0) {
          const parsedData = typeof response.data.data === 'string'
            ? JSON.parse(response.data.data)
            : response.data.data;

          setFlowchart({
            ...flowchart,
            title: response.data.name,
            nodes: parsedData.nodes || flowchart.nodes,
            connections: parsedData.connections || [],
            canvasWidth: parsedData.canvasWidth || 1200,
            canvasHeight: parsedData.canvasHeight || 800
          });
        }
      } catch (error) {
        console.error('Error fetching flowchart:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (id !== 'new') {
      fetchFlowchart();
    } else {
      setIsLoading(false);
    }
    // eslint-disable-next-line
  }, [id]);

  // Auto-save functionality
  useEffect(() => {
    const saveFlowchart = async () => {
      if (!flowchart || id === 'new') return;
      try {
        await axios.put(`/api/boards/update`, {
          boardId: id,
          title: flowchart.title,
          data: {
            nodes: flowchart.nodes,
            connections: flowchart.connections,
            canvasWidth: flowchart.canvasWidth,
            canvasHeight: flowchart.canvasHeight
          }
        });
      } catch (error) {
        console.error('Error saving flowchart:', error);
      }
    };
    const interval = setInterval(saveFlowchart, 10000);
    return () => clearInterval(interval);
  }, [flowchart, id]);

  // Get SVG coordinates from mouse event
  const getSVGCoordinates = (event) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    return { x, y };
  };

  const handleCanvasClick = (event) => {
    // More permissive check - allow clicks on the SVG or its background elements
    const isCanvasClick = event.target === svgRef.current || 
                         (event.target.tagName === 'rect' && event.target.getAttribute('fill') === 'url(#grid)');
    
    if (!isCanvasClick) return;

    if (selectedTool === 'select') {
      setSelectedNode(null);
      setConnecting(null);
      return;
    }

    if (selectedTool === 'connect') {
      return;
    }

    if (nodeTypes[selectedTool]) {
      const { x, y } = getSVGCoordinates(event);
      addNode(selectedTool, x, y);
    }
  };

  const addNode = (type, x, y) => {
    const newNode = {
      id: Date.now().toString(),
      type,
      x: x - 60,
      y: y - 30,
      width: type === 'decision' ? 120 : 100,
      height: type === 'decision' ? 80 : 60,
      text: nodeTypes[type].defaultText,
      color: nodeTypes[type].color,
      textColor: '#ffffff'
    };
    
    setFlowchart(prev => ({
      ...prev,
      nodes: [...prev.nodes, newNode]
    }));
    setSelectedNode(newNode.id);
  };

  const updateNode = (nodeId, updates) => {
    setFlowchart(prev => ({
      ...prev,
      nodes: prev.nodes.map(node =>
        node.id === nodeId ? { ...node, ...updates } : node
      )
    }));
  };

  const deleteNode = (nodeId) => {
    setFlowchart(prev => ({
      ...prev,
      nodes: prev.nodes.filter(node => node.id !== nodeId),
      connections: prev.connections.filter(conn =>
        conn.from !== nodeId && conn.to !== nodeId
      )
    }));
    setSelectedNode(null);
  };

  const addConnection = (fromId, toId) => {
    if (fromId === toId) return;
    const exists = flowchart.connections.some(conn =>
      conn.from === fromId && conn.to === toId
    );
    if (exists) return;

    const newConnection = {
      id: `conn-${Date.now()}`,
      from: fromId,
      to: toId,
      label: '',
      color: '#64748b'
    };
    setFlowchart(prev => ({
      ...prev,
      connections: [...prev.connections, newConnection]
    }));
  };

  const deleteConnection = (connectionId) => {
    setFlowchart(prev => ({
      ...prev,
      connections: prev.connections.filter(conn => conn.id !== connectionId)
    }));
  };

  const handleNodeMouseDown = (event, nodeId) => {
    event.stopPropagation();
    if (connecting) {
      if (connecting !== nodeId) {
        addConnection(connecting, nodeId);
      }
      setConnecting(null);
      return;
    }
    setSelectedNode(nodeId);
    setDraggedNode(nodeId);
    setIsDragging(true);

    const { x, y } = getSVGCoordinates(event);
    const node = flowchart.nodes.find(n => n.id === nodeId);
    setDragStart({
      x: x - node.x,
      y: y - node.y
    });
  };

  const handleMouseMove = (event) => {
    if (!isDragging || !draggedNode) return;
    const { x, y } = getSVGCoordinates(event);
    updateNode(draggedNode, {
      x: x - dragStart.x,
      y: y - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDraggedNode(null);
    setDragStart({ x: 0, y: 0 });
  };

  // Touch handlers for mobile support
  const handleNodeTouchStart = (event, nodeId) => {
    event.preventDefault(); // Prevent default touch behaviors
    event.stopPropagation();
    
    if (connecting) {
      if (connecting !== nodeId) {
        addConnection(connecting, nodeId);
      }
      setConnecting(null);
      return;
    }
    setSelectedNode(nodeId);
    setDraggedNode(nodeId);
    setIsDragging(true);

    const touch = event.touches[0];
    const rect = svgRef.current.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    const node = flowchart.nodes.find(n => n.id === nodeId);
    setDragStart({
      x: x - node.x,
      y: y - node.y
    });
  };

  const handleTouchMove = (event) => {
    if (!isDragging || !draggedNode) return;
    event.preventDefault(); // Prevent scrolling while dragging
    
    const touch = event.touches[0];
    const rect = svgRef.current.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    updateNode(draggedNode, {
      x: x - dragStart.x,
      y: y - dragStart.y
    });
  };

  const handleTouchEnd = (event) => {
    event.preventDefault();
    setIsDragging(false);
    setDraggedNode(null);
    setDragStart({ x: 0, y: 0 });
  };

  const startConnecting = () => {
    if (selectedNode) {
      setConnecting(selectedNode);
    }
  };

  const saveManually = async () => {
    try {
      await axios.put(`/api/boards/update`, {
        boardId: id,
        title: flowchart.title,
        data: {
          nodes: flowchart.nodes,
          connections: flowchart.connections,
          canvasWidth: flowchart.canvasWidth,
          canvasHeight: flowchart.canvasHeight
        }
      });
    } catch (error) {
      console.error('Error saving flowchart:', error);
    }
  };

  const renderNodeShape = (node) => {
    const { type, x, y, width, height, color } = node;
    const nodeType = nodeTypes[type];
    const isSelected = selectedNode === node.id;

    const commonProps = {
      fill: color,
      stroke: isSelected ? '#1f2937' : '#ffffff',
      strokeWidth: isSelected ? 3 : 2,
      className: 'cursor-move',
      onMouseDown: (e) => handleNodeMouseDown(e, node.id),
      onTouchStart: (e) => handleNodeTouchStart(e, node.id),
      onDoubleClick: () => setEditingNode(node.id)
    };

    switch (nodeType.shape) {
      case 'rectangle':
        return (
          <rect
            x={x - width / 2}
            y={y - height / 2}
            width={width}
            height={height}
            rx="8"
            {...commonProps}
          />
        );
      case 'oval':
        return (
          <ellipse
            cx={x}
            cy={y}
            rx={width / 2}
            ry={height / 2}
            {...commonProps}
          />
        );
      case 'diamond':
        const points = [
          [x, y - height / 2],
          [x + width / 2, y],
          [x, y + height / 2],
          [x - width / 2, y]
        ].map(point => point.join(',')).join(' ');
        return (
          <polygon
            points={points}
            {...commonProps}
          />
        );
      case 'circle':
        return (
          <circle
            cx={x}
            cy={y}
            r={Math.min(width, height) / 2}
            {...commonProps}
          />
        );
      default:
        return null;
    }
  };

  const generateArrowPath = (connection) => {
    const fromNode = flowchart.nodes.find(n => n.id === connection.from);
    const toNode = flowchart.nodes.find(n => n.id === connection.to);

    if (!fromNode || !toNode) return '';
    const dx = toNode.x - fromNode.x;
    const dy = toNode.y - fromNode.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance === 0) return '';
    const angle = Math.atan2(dy, dx);

    // Calculate connection points on node edges
    const fromRadius = Math.max(fromNode.width, fromNode.height) / 2;
    const toRadius = Math.max(toNode.width, toNode.height) / 2;

    const fromX = fromNode.x + Math.cos(angle) * fromRadius;
    const fromY = fromNode.y + Math.sin(angle) * fromRadius;
    const toX = toNode.x - Math.cos(angle) * toRadius;
    const toY = toNode.y - Math.sin(angle) * toRadius;

    return `M ${fromX} ${fromY} L ${toX} ${toY}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-lg text-gray-600">Loading flowchart...</div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <input
              type="text"
              value={flowchart.title}
              onChange={(e) => setFlowchart(prev => ({ ...prev, title: e.target.value }))}
              className="text-2xl font-bold bg-transparent border-none outline-none focus:bg-gray-50 px-2 py-1 rounded"
              onBlur={saveManually}
            />
            <div className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
              Flowchart
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={saveManually}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Save className="w-4 h-4" />
              Save
            </button>
          </div>
        </div>
      </div>
      {/* Toolbar */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center gap-4 flex-wrap">
          {/* Selection Tool */}
          <button
            onClick={() => {
              setSelectedTool('select');
              setConnecting(null);
            }}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
              selectedTool === 'select'
                ? 'bg-blue-100 border-blue-300 text-blue-800'
                : 'hover:bg-gray-50 border-gray-200'
            }`}
          >
            <MousePointer className="w-4 h-4" />
            <span className="text-sm">Select</span>
          </button>
          <div className="h-6 w-px bg-gray-300"></div>
          {/* Node Types */}
          {Object.entries(nodeTypes).map(([type, config]) => {
            const IconComponent = config.icon;
            return (
              <button
                key={type}
                onClick={() => {
                  setSelectedTool(type);
                  setConnecting(null);
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                  selectedTool === type
                    ? 'bg-blue-100 border-blue-300 text-blue-800'
                    : 'hover:bg-gray-50 border-gray-200'
                }`}
              >
                <IconComponent className="w-4 h-4" />
                <span className="text-sm">{config.label}</span>
              </button>
            );
          })}
          <div className="h-6 w-px bg-gray-300"></div>
          {/* Connection Tool */}
          <button
            onClick={startConnecting}
            disabled={!selectedNode}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
              connecting
                ? 'bg-green-100 border-green-300 text-green-800'
                : selectedNode
                ? 'hover:bg-gray-50 border-gray-200'
                : 'opacity-50 cursor-not-allowed border-gray-200'
            }`}
          >
            <ArrowRight className="w-4 h-4" />
            <span className="text-sm">
              {connecting ? 'Click target node' : 'Connect'}
            </span>
          </button>
          {/* Delete Button */}
          {selectedNode && (
            <button
              onClick={() => deleteNode(selectedNode)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-red-200 hover:bg-red-50 text-red-600 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span className="text-sm">Delete</span>
            </button>
          )}
          <div className="h-6 w-px bg-gray-300"></div>
          {/* Grid Toggle */}
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
              showGrid
                ? 'bg-gray-100 border-gray-300'
                : 'hover:bg-gray-50 border-gray-200'
            }`}
          >
            <Grid3X3 className="w-4 h-4" />
            <span className="text-sm">Grid</span>
          </button>
        </div>
        <div className="text-xs text-gray-500 mt-3">
          {selectedTool === 'select'
            ? 'Click nodes to select • Drag to move • Double-click to edit text'
            : `Click anywhere on canvas to add ${nodeTypes[selectedTool]?.label || selectedTool} nodes`}
          {connecting && (
            <span className="text-green-600 ml-4">
              → Click another node to create connection
            </span>
          )}
        </div>
      </div>
      {/* Canvas */}
      <div className="flex-1 overflow-hidden relative">
        <svg
          ref={svgRef}
          className="w-full h-full"
          style={{
            cursor: selectedTool === 'select' ? 'default' : 'crosshair',
            touchAction: 'none'
          }}
          onClick={handleCanvasClick}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Grid */}
          {showGrid && (
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f1f5f9" strokeWidth="1" />
              </pattern>
            </defs>
          )}
          {showGrid && <rect width="100%" height="100%" fill="url(#grid)" />}
          {/* Arrow marker definition */}
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <polygon
                points="0 0, 10 3.5, 0 7"
                fill="#64748b"
              />
            </marker>
          </defs>
          {/* Connections */}
          {flowchart.connections.map(connection => {
            const path = generateArrowPath(connection);
            if (!path) return null;
            return (
              <g key={connection.id}>
                <path
                  d={path}
                  stroke={connection.color || '#64748b'}
                  strokeWidth="2"
                  fill="none"
                  markerEnd="url(#arrowhead)"
                  className="hover:stroke-blue-600 cursor-pointer"
                  onClick={e => {
                    e.stopPropagation();
                    if (window.confirm('Delete this connection?')) {
                      deleteConnection(connection.id);
                    }
                  }}
                />
              </g>
            );
          })}
          {/* Nodes */}
          {flowchart.nodes.map(node => (
            <g key={node.id}>
              {renderNodeShape(node)}
              {/* Node Text */}
              {editingNode === node.id ? (
                <foreignObject
                  x={node.x - node.width / 2}
                  y={node.y - 10}
                  width={node.width}
                  height="20"
                >
                  <input
                    type="text"
                    value={node.text}
                    onChange={e => updateNode(node.id, { text: e.target.value })}
                    onBlur={() => setEditingNode(null)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        setEditingNode(null);
                      }
                    }}
                    className="w-full text-center text-sm bg-white border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                </foreignObject>
              ) : (
                <text
                  x={node.x}
                  y={node.y + 5}
                  textAnchor="middle"
                  className="pointer-events-none select-none"
                  fill={node.textColor || '#ffffff'}
                  fontSize="14"
                  fontWeight="500"
                >
                  {node.text}
                </text>
              )}
              {/* Connection Points */}
              {connecting === node.id && (
                <circle
                  cx={node.x}
                  cy={node.y}
                  r="8"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="3"
                  strokeDasharray="5,5"
                  className="animate-pulse"
                />
              )}
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}

export default FlowchartEditor;