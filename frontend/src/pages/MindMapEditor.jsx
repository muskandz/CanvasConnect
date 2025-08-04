import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeft, Save, Plus, Trash2, Edit3, 
  Circle, Square, Triangle, Palette
} from 'lucide-react';

export default function MindMapEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const svgRef = useRef(null);
  const [isDragging, setIsDragging] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  const [mindMap, setMindMap] = useState({
    title: 'Mind Map',
    centerNode: {
      id: 'center',
      text: 'Main Topic',
      x: 400,
      y: 300,
      color: '#3b82f6',
      size: 'large'
    },
    nodes: [],
    connections: []
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState(null);
  const [editingNode, setEditingNode] = useState(null);
  const [showColorPicker, setShowColorPicker] = useState(null);

  const colors = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', 
    '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
  ];

  // Load mind map data
  useEffect(() => {
    const loadMindMap = async () => {
      try {
        const res = await axios.get(`https://canvasconnect-fcch.onrender.com/api/boards/${id}`);
        const boardData = res.data;
        
        if (boardData.data) {
          try {
            const parsedData = typeof boardData.data === 'string' 
              ? JSON.parse(boardData.data) 
              : boardData.data;
              
            if (parsedData.centerNode) {
              setMindMap({
                title: boardData.title || 'Mind Map',
                centerNode: parsedData.centerNode,
                nodes: parsedData.nodes || [],
                connections: parsedData.connections || []
              });
            }
          } catch (e) {
            console.error('Failed to parse mind map data:', e);
          }
        }
      } catch (error) {
        console.error('Failed to load mind map:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadMindMap();
  }, [id]);

  // Save mind map
  const saveMindMap = async () => {
    try {
      await axios.put('https://canvasconnect-fcch.onrender.com/api/boards/update', {
        boardId: id,
        title: mindMap.title,
        data: JSON.stringify({
          centerNode: mindMap.centerNode,
          nodes: mindMap.nodes,
          connections: mindMap.connections
        }),
        templateType: 'mindmap'
      });
    } catch (error) {
      console.error('Failed to save mind map:', error);
    }
  };

  // Auto-save
  useEffect(() => {
    const interval = setInterval(saveMindMap, 10000);
    return () => clearInterval(interval);
  }, [mindMap]);

  // Add new node
  const addNode = (parentId) => {
    const parentNode = parentId === 'center' 
      ? mindMap.centerNode 
      : mindMap.nodes.find(n => n.id === parentId);
    
    if (!parentNode) return;

    // Calculate position for new node
    const angle = Math.random() * Math.PI * 2;
    const distance = 150;
    const newX = parentNode.x + Math.cos(angle) * distance;
    const newY = parentNode.y + Math.sin(angle) * distance;

    const newNode = {
      id: Date.now().toString(),
      text: 'New Topic',
      x: newX,
      y: newY,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 'medium',
      parentId
    };

    const newConnection = {
      id: `conn-${Date.now()}`,
      from: parentId,
      to: newNode.id
    };

    setMindMap(prev => ({
      ...prev,
      nodes: [...prev.nodes, newNode],
      connections: [...prev.connections, newConnection]
    }));

    setEditingNode(newNode.id);
  };

  // Update node
  const updateNode = (nodeId, updates) => {
    if (nodeId === 'center') {
      setMindMap(prev => ({
        ...prev,
        centerNode: { ...prev.centerNode, ...updates }
      }));
    } else {
      setMindMap(prev => ({
        ...prev,
        nodes: prev.nodes.map(node =>
          node.id === nodeId ? { ...node, ...updates } : node
        )
      }));
    }
  };

  // Delete node
  const deleteNode = (nodeId) => {
    if (nodeId === 'center') return;

    // Find all child nodes
    const nodesToDelete = [nodeId];
    const findChildren = (parentId) => {
      mindMap.nodes.forEach(node => {
        if (node.parentId === parentId) {
          nodesToDelete.push(node.id);
          findChildren(node.id);
        }
      });
    };
    findChildren(nodeId);

    // Remove nodes and their connections
    setMindMap(prev => ({
      ...prev,
      nodes: prev.nodes.filter(node => !nodesToDelete.includes(node.id)),
      connections: prev.connections.filter(conn => 
        !nodesToDelete.includes(conn.from) && !nodesToDelete.includes(conn.to)
      )
    }));
  };

  // Mouse handlers for dragging
  const handleMouseDown = (e, nodeId) => {
    if (e.button !== 0) return; // Only left click
    
    setIsDragging(nodeId);
    const rect = svgRef.current.getBoundingClientRect();
    const node = nodeId === 'center' 
      ? mindMap.centerNode 
      : mindMap.nodes.find(n => n.id === nodeId);
    
    setDragOffset({
      x: e.clientX - rect.left - node.x,
      y: e.clientY - rect.top - node.y
    });
    
    e.preventDefault();
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    const rect = svgRef.current.getBoundingClientRect();
    const newX = e.clientX - rect.left - dragOffset.x;
    const newY = e.clientY - rect.top - dragOffset.y;
    
    updateNode(isDragging, { x: newX, y: newY });

    // Update connections for dragged node's children
    if (isDragging !== 'center') {
      const childConnections = mindMap.connections.filter(conn => conn.from === isDragging);
      // Connections will auto-update based on node positions
    }
  };

  const handleMouseUp = () => {
    setIsDragging(null);
    setDragOffset({ x: 0, y: 0 });
  };

  // Get node by ID
  const getNode = (nodeId) => {
    return nodeId === 'center' 
      ? mindMap.centerNode 
      : mindMap.nodes.find(n => n.id === nodeId);
  };

  // Generate connection path
  const getConnectionPath = (connection) => {
    const fromNode = getNode(connection.from);
    const toNode = getNode(connection.to);
    
    if (!fromNode || !toNode) return '';

    // Simple curved line
    const midX = (fromNode.x + toNode.x) / 2;
    const midY = (fromNode.y + toNode.y) / 2;
    const controlX = midX + (fromNode.y - toNode.y) * 0.2;
    const controlY = midY + (toNode.x - fromNode.x) * 0.2;

    return `M ${fromNode.x} ${fromNode.y} Q ${controlX} ${controlY} ${toNode.x} ${toNode.y}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading mind map...</div>
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
              value={mindMap.title}
              onChange={(e) => setMindMap(prev => ({ ...prev, title: e.target.value }))}
              className="text-2xl font-bold bg-transparent border-none outline-none"
              onBlur={saveMindMap}
            />
            
            <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
              Mind Map
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={saveMindMap}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Save className="w-4 h-4" />
              Save
            </button>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white border-b px-6 py-3">
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600">
            Click nodes to select • Double-click to edit • Right-click to add child nodes
          </div>
        </div>
      </div>

      {/* Mind Map Canvas */}
      <div className="flex-1 overflow-hidden relative">
        <svg
          ref={svgRef}
          className="w-full h-full cursor-default"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Connections */}
          <g>
            {mindMap.connections.map(connection => (
              <path
                key={connection.id}
                d={getConnectionPath(connection)}
                stroke="#64748b"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
              />
            ))}
          </g>

          {/* Center Node */}
          <g>
            <circle
              cx={mindMap.centerNode.x}
              cy={mindMap.centerNode.y}
              r="50"
              fill={mindMap.centerNode.color}
              stroke={selectedNode === 'center' ? '#1f2937' : 'white'}
              strokeWidth={selectedNode === 'center' ? '3' : '2'}
              className="cursor-move"
              onMouseDown={(e) => handleMouseDown(e, 'center')}
              onClick={() => setSelectedNode('center')}
              onDoubleClick={() => setEditingNode('center')}
              onContextMenu={(e) => {
                e.preventDefault();
                addNode('center');
              }}
            />
            
            {editingNode === 'center' ? (
              <foreignObject
                x={mindMap.centerNode.x - 60}
                y={mindMap.centerNode.y - 10}
                width="120"
                height="20"
              >
                <input
                  type="text"
                  value={mindMap.centerNode.text}
                  onChange={(e) => updateNode('center', { text: e.target.value })}
                  onBlur={() => setEditingNode(null)}
                  onKeyDown={(e) => e.key === 'Enter' && setEditingNode(null)}
                  className="w-full text-center text-sm bg-white border rounded px-2 py-1"
                  autoFocus
                />
              </foreignObject>
            ) : (
              <text
                x={mindMap.centerNode.x}
                y={mindMap.centerNode.y + 5}
                textAnchor="middle"
                fill="white"
                fontSize="14"
                fontWeight="bold"
                className="pointer-events-none select-none"
              >
                {mindMap.centerNode.text}
              </text>
            )}
          </g>

          {/* Branch Nodes */}
          {mindMap.nodes.map(node => (
            <g key={node.id}>
              <circle
                cx={node.x}
                cy={node.y}
                r="35"
                fill={node.color}
                stroke={selectedNode === node.id ? '#1f2937' : 'white'}
                strokeWidth={selectedNode === node.id ? '3' : '2'}
                className="cursor-move"
                onMouseDown={(e) => handleMouseDown(e, node.id)}
                onClick={() => setSelectedNode(node.id)}
                onDoubleClick={() => setEditingNode(node.id)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  addNode(node.id);
                }}
              />
              
              {editingNode === node.id ? (
                <foreignObject
                  x={node.x - 50}
                  y={node.y - 10}
                  width="100"
                  height="20"
                >
                  <input
                    type="text"
                    value={node.text}
                    onChange={(e) => updateNode(node.id, { text: e.target.value })}
                    onBlur={() => setEditingNode(null)}
                    onKeyDown={(e) => e.key === 'Enter' && setEditingNode(null)}
                    className="w-full text-center text-xs bg-white border rounded px-2 py-1"
                    autoFocus
                  />
                </foreignObject>
              ) : (
                <text
                  x={node.x}
                  y={node.y + 4}
                  textAnchor="middle"
                  fill="white"
                  fontSize="12"
                  fontWeight="bold"
                  className="pointer-events-none select-none"
                >
                  {node.text.length > 10 ? `${node.text.substring(0, 10)}...` : node.text}
                </text>
              )}
            </g>
          ))}
        </svg>

        {/* Selected Node Controls */}
        {selectedNode && (
          <div className="absolute top-4 right-4 bg-white border rounded-lg shadow-lg p-4">
            <div className="text-sm font-medium mb-3">
              {selectedNode === 'center' ? 'Center Node' : 'Branch Node'}
            </div>
            
            <div className="space-y-3">
              {/* Color Picker */}
              <div>
                <div className="text-xs text-gray-500 mb-2">Color</div>
                <div className="flex gap-2">
                  {colors.map(color => (
                    <button
                      key={color}
                      onClick={() => updateNode(selectedNode, { color })}
                      className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => addNode(selectedNode)}
                  className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  <Plus className="w-3 h-3" />
                  Add Child
                </button>
                
                {selectedNode !== 'center' && (
                  <button
                    onClick={() => {
                      deleteNode(selectedNode);
                      setSelectedNode(null);
                    }}
                    className="flex items-center gap-1 px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    <Trash2 className="w-3 h-3" />
                    Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
