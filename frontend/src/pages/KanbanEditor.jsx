import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { apiClient, API_ENDPOINTS } from "../config/api";
import { ArrowLeft, Plus, Edit3, Trash2, GripVertical, Calendar, User, Flag, Clock, Tag, MoreHorizontal, X } from 'lucide-react';

export default function KanbanEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [board, setBoard] = useState({
    title: 'Kanban Board',
    columns: [
      { id: 'backlog', title: 'Backlog', cards: [], color: '#e2e8f0' },
      { id: 'todo', title: 'To Do', cards: [], color: '#fef3c7' },
      { id: 'inprogress', title: 'In Progress', cards: [], color: '#dbeafe' },
      { id: 'review', title: 'Review', cards: [], color: '#f3e8ff' },
      { id: 'done', title: 'Done', cards: [], color: '#d1fae5' }
    ]
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [showNewCardForm, setShowNewCardForm] = useState(null);
  const [showNewColumnForm, setShowNewColumnForm] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [newCardDescription, setNewCardDescription] = useState('');
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [editingCard, setEditingCard] = useState(null);
  const [draggedCard, setDraggedCard] = useState(null);
  const [draggedFrom, setDraggedFrom] = useState(null);
  const [cardPriority, setCardPriority] = useState('medium');
  const [cardAssignee, setCardAssignee] = useState('');
  const [cardDueDate, setCardDueDate] = useState('');
  const [cardLabels, setCardLabels] = useState([]);
  const [showCardDetails, setShowCardDetails] = useState(null);

  // Load kanban data
  useEffect(() => {
    const loadBoard = async () => {
      try {
        const res = await apiClient.get(API_ENDPOINTS.BOARD_BY_ID(id));
        const boardData = res.data;
        
        if (boardData.data) {
          try {
            const parsedData = typeof boardData.data === 'string' 
              ? JSON.parse(boardData.data) 
              : boardData.data;
            
            if (parsedData.columns) {
              setBoard(prev => ({
                ...prev,
                title: boardData.title,
                columns: parsedData.columns
              }));
            }
          } catch (parseError) {
            console.error('Failed to parse board data:', parseError);
          }
        }
      } catch (error) {
        console.error('Failed to load board:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadBoard();
  }, [id]);

  // Save board data
  const saveBoard = async () => {
    try {
      await apiClient.put(API_ENDPOINTS.UPDATE_BOARD, {
        boardId: id,
        title: board.title,
        data: JSON.stringify({ columns: board.columns }),
        templateType: 'kanban'
      });
    } catch (error) {
      console.error('Failed to save board:', error);
    }
  };

  // Auto-save every 10 seconds
  useEffect(() => {
    const interval = setInterval(saveBoard, 10000);
    return () => clearInterval(interval);
  }, [board]);

  // Handle native drag and drop
  const handleDragStart = (e, card, columnId) => {
    setDraggedCard(card);
    setDraggedFrom(columnId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetColumnId) => {
    e.preventDefault();
    
    if (!draggedCard || !draggedFrom) return;
    
    if (draggedFrom === targetColumnId) {
      setDraggedCard(null);
      setDraggedFrom(null);
      return;
    }

    // Move card between columns
    setBoard(prev => {
      const newBoard = { ...prev };
      
      // Remove from source column
      const sourceColumn = newBoard.columns.find(col => col.id === draggedFrom);
      if (sourceColumn) {
        sourceColumn.cards = sourceColumn.cards.filter(card => card.id !== draggedCard.id);
      }
      
      // Add to target column
      const targetColumn = newBoard.columns.find(col => col.id === targetColumnId);
      if (targetColumn) {
        targetColumn.cards.push(draggedCard);
      }
      
      return newBoard;
    });

    setDraggedCard(null);
    setDraggedFrom(null);
  };

  // Add new card
  const handleAddCard = (columnId) => {
    if (!newCardTitle.trim()) return;

    const newCard = {
      id: Date.now().toString(),
      title: newCardTitle,
      description: newCardDescription,
      priority: cardPriority,
      assignee: cardAssignee,
      dueDate: cardDueDate,
      labels: cardLabels,
      comments: [],
      attachments: [],
      checklist: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setBoard(prev => ({
      ...prev,
      columns: prev.columns.map(col =>
        col.id === columnId
          ? { ...col, cards: [...col.cards, newCard] }
          : col
      )
    }));

    // Reset form
    setNewCardTitle('');
    setNewCardDescription('');
    setCardPriority('medium');
    setCardAssignee('');
    setCardDueDate('');
    setCardLabels([]);
    setShowNewCardForm(null);
  };

  // Add new column
  const handleAddColumn = () => {
    if (!newColumnTitle.trim()) return;

    const newColumn = {
      id: Date.now().toString(),
      title: newColumnTitle,
      cards: [],
      color: '#f1f5f9'
    };

    setBoard(prev => ({
      ...prev,
      columns: [...prev.columns, newColumn]
    }));

    setNewColumnTitle('');
    setShowNewColumnForm(false);
  };

  // Delete column
  const handleDeleteColumn = (columnId) => {
    if (window.confirm('Are you sure? This will delete all cards in this column.')) {
      setBoard(prev => ({
        ...prev,
        columns: prev.columns.filter(col => col.id !== columnId)
      }));
    }
  };

  // Edit column title
  const handleEditColumnTitle = (columnId, newTitle) => {
    setBoard(prev => ({
      ...prev,
      columns: prev.columns.map(col =>
        col.id === columnId ? { ...col, title: newTitle } : col
      )
    }));
  };

  // Edit card
  const handleEditCard = (card) => {
    setEditingCard(card);
    setNewCardTitle(card.title);
    setNewCardDescription(card.description || '');
    setCardPriority(card.priority || 'medium');
    setCardAssignee(card.assignee || '');
    setCardDueDate(card.dueDate || '');
    setCardLabels(card.labels || []);
  };

  const handleUpdateCard = () => {
    if (!newCardTitle.trim()) return;

    setBoard(prev => ({
      ...prev,
      columns: prev.columns.map(col => ({
        ...col,
        cards: col.cards.map(card =>
          card.id === editingCard.id
            ? { 
                ...card, 
                title: newCardTitle, 
                description: newCardDescription,
                priority: cardPriority,
                assignee: cardAssignee,
                dueDate: cardDueDate,
                labels: cardLabels,
                updatedAt: new Date().toISOString()
              }
            : card
        )
      }))
    }));

    // Reset form
    setEditingCard(null);
    setNewCardTitle('');
    setNewCardDescription('');
    setCardPriority('medium');
    setCardAssignee('');
    setCardDueDate('');
    setCardLabels([]);
  };

  // Add label to card
  const addLabel = (label) => {
    if (!cardLabels.includes(label)) {
      setCardLabels([...cardLabels, label]);
    }
  };

  // Remove label from card
  const removeLabel = (label) => {
    setCardLabels(cardLabels.filter(l => l !== label));
  };

  const availableLabels = ['Bug', 'Feature', 'Enhancement', 'Documentation', 'Testing', 'Design'];
  
  const getLabelColor = (label) => {
    const colors = {
      'Bug': 'bg-red-100 text-red-800 border-red-200',
      'Feature': 'bg-blue-100 text-blue-800 border-blue-200',
      'Enhancement': 'bg-green-100 text-green-800 border-green-200',
      'Documentation': 'bg-purple-100 text-purple-800 border-purple-200',
      'Testing': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Design': 'bg-pink-100 text-pink-800 border-pink-200'
    };
    return colors[label] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  // Delete card
  const handleDeleteCard = (cardId) => {
    if (window.confirm('Are you sure you want to delete this card?')) {
      setBoard(prev => ({
        ...prev,
        columns: prev.columns.map(col => ({
          ...col,
          cards: col.cards.filter(card => card.id !== cardId)
        }))
      }));
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'border-red-300 bg-red-50 text-red-700';
      case 'medium': return 'border-yellow-300 bg-yellow-50 text-yellow-700';
      case 'low': return 'border-green-300 bg-green-50 text-green-700';
      default: return 'border-gray-300 bg-gray-50 text-gray-700';
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading kanban board...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-semibold text-gray-900">{board.title}</h1>
        </div>
        <button
          onClick={saveBoard}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Save Board
        </button>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 p-6 overflow-x-auto">
        <div className="flex gap-6 h-full min-w-max">
          {board.columns.map((column) => (
            <div
              key={column.id}
              className="w-80 bg-white rounded-lg shadow-sm border flex flex-col"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              {/* Column Header */}
              <div className="p-4 border-b bg-gray-50 rounded-t-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: column.color }}
                    ></div>
                    <input
                      type="text"
                      value={column.title}
                      onChange={(e) => handleEditColumnTitle(column.id, e.target.value)}
                      className="font-semibold text-gray-900 bg-transparent border-none outline-none"
                      onBlur={saveBoard}
                    />
                    <span className="bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded-full">
                      {column.cards.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setShowNewCardForm(column.id)}
                      className="p-1 hover:bg-gray-200 rounded text-gray-600"
                      title="Add card"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteColumn(column.id)}
                      className="p-1 hover:bg-red-100 rounded text-red-600"
                      title="Delete column"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Add Card Form */}
              {showNewCardForm === column.id && (
                <div className="p-4 border-b bg-blue-50">
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Enter card title..."
                      value={newCardTitle}
                      onChange={(e) => setNewCardTitle(e.target.value)}
                      className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                    <textarea
                      placeholder="Add description..."
                      value={newCardDescription}
                      onChange={(e) => setNewCardDescription(e.target.value)}
                      className="w-full border rounded px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-blue-500"
                      rows="2"
                    />
                    
                    {/* Card Properties */}
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={cardPriority}
                        onChange={(e) => setCardPriority(e.target.value)}
                        className="border rounded px-2 py-1 text-sm"
                      >
                        <option value="low">Low Priority</option>
                        <option value="medium">Medium Priority</option>
                        <option value="high">High Priority</option>
                        <option value="urgent">Urgent</option>
                      </select>
                      
                      <input
                        type="date"
                        value={cardDueDate}
                        onChange={(e) => setCardDueDate(e.target.value)}
                        className="border rounded px-2 py-1 text-sm"
                      />
                    </div>
                    
                    <input
                      type="text"
                      placeholder="Assignee"
                      value={cardAssignee}
                      onChange={(e) => setCardAssignee(e.target.value)}
                      className="w-full border rounded px-3 py-2 text-sm"
                    />
                    
                    {/* Labels */}
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-1">
                        {cardLabels.map(label => (
                          <span key={label} className={`px-2 py-1 rounded-full text-xs border ${getLabelColor(label)}`}>
                            {label}
                            <button onClick={() => removeLabel(label)} className="ml-1">×</button>
                          </span>
                        ))}
                      </div>
                      {cardLabels.length < 3 && (
                        <select
                          onChange={(e) => {
                            if (e.target.value) {
                              addLabel(e.target.value);
                              e.target.value = '';
                            }
                          }}
                          className="border rounded px-2 py-1 text-sm"
                        >
                          <option value="">Add label...</option>
                          {availableLabels.filter(label => !cardLabels.includes(label)).map(label => (
                            <option key={label} value={label}>{label}</option>
                          ))}
                        </select>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAddCard(column.id)}
                        className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 flex-1"
                      >
                        Add Card
                      </button>
                      <button
                        onClick={() => {
                          setShowNewCardForm(null);
                          setNewCardTitle('');
                          setNewCardDescription('');
                          setCardPriority('medium');
                          setCardAssignee('');
                          setCardDueDate('');
                          setCardLabels([]);
                        }}
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Cards */}
              <div className="flex-1 p-4 space-y-3 overflow-y-auto min-h-0">
                {column.cards.map((card) => (
                  <div
                    key={card.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, card, column.id)}
                    className="bg-white p-3 rounded-lg border shadow-sm hover:shadow-md transition-all cursor-move select-none border-l-4"
                    style={{ borderLeftColor: card.priority === 'urgent' ? '#ef4444' : card.priority === 'high' ? '#f59e0b' : card.priority === 'medium' ? '#3b82f6' : '#10b981' }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <GripVertical className="w-3 h-3 text-gray-400" />
                          <h4 className="font-medium text-gray-900 text-sm">{card.title}</h4>
                        </div>
                        {card.description && (
                          <p className="text-xs text-gray-600 ml-5 mb-2">{card.description}</p>
                        )}
                        
                        {/* Card Labels */}
                        {card.labels && card.labels.length > 0 && (
                          <div className="flex flex-wrap gap-1 ml-5 mb-2">
                            {card.labels.map(label => (
                              <span key={label} className={`px-2 py-1 rounded-full text-xs border ${getLabelColor(label)}`}>
                                {label}
                              </span>
                            ))}
                          </div>
                        )}
                        
                        {/* Card Footer */}
                        <div className="flex items-center justify-between text-xs ml-5">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              <Flag className={`w-3 h-3 ${card.priority === 'urgent' ? 'text-red-500' : card.priority === 'high' ? 'text-orange-500' : card.priority === 'medium' ? 'text-blue-500' : 'text-green-500'}`} />
                              <span className="text-gray-600">{card.priority}</span>
                            </div>
                            {card.assignee && (
                              <div className="flex items-center gap-1 text-gray-500">
                                <User className="w-3 h-3" />
                                <span>{card.assignee}</span>
                              </div>
                            )}
                          </div>
                          {card.dueDate && (
                            <div className={`flex items-center gap-1 ${new Date(card.dueDate) < new Date() ? 'text-red-500' : 'text-gray-500'}`}>
                              <Calendar className="w-3 h-3" />
                              <span>{new Date(card.dueDate).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1 ml-2">
                        <button
                          onClick={() => setShowCardDetails(card)}
                          className="p-1 hover:bg-gray-100 rounded"
                          title="View details"
                        >
                          <MoreHorizontal className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleEditCard(card)}
                          className="p-1 hover:bg-gray-100 rounded"
                          title="Edit card"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDeleteCard(card.id)}
                          className="p-1 hover:bg-gray-100 rounded text-red-600"
                          title="Delete card"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          
          {/* Add Column Button */}
          <div className="w-80 flex-shrink-0">
            {showNewColumnForm ? (
              <div className="bg-white rounded-lg shadow-sm border p-4">
                <input
                  type="text"
                  placeholder="Enter column title..."
                  value={newColumnTitle}
                  onChange={(e) => setNewColumnTitle(e.target.value)}
                  className="w-full border rounded px-3 py-2 mb-3 text-sm focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleAddColumn}
                    className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 flex-1"
                  >
                    Add Column
                  </button>
                  <button
                    onClick={() => {
                      setShowNewColumnForm(false);
                      setNewColumnTitle('');
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowNewColumnForm(true)}
                className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors"
              >
                <div className="text-center">
                  <Plus className="w-8 h-8 mx-auto mb-2" />
                  <span>Add Column</span>
                </div>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Edit Card Modal */}
      {editingCard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Edit Card</h3>
              <button
                onClick={() => {
                  setEditingCard(null);
                  setNewCardTitle('');
                  setNewCardDescription('');
                  setCardPriority('medium');
                  setCardAssignee('');
                  setCardDueDate('');
                  setCardLabels([]);
                }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  placeholder="Card title"
                  value={newCardTitle}
                  onChange={(e) => setNewCardTitle(e.target.value)}
                  className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  placeholder="Add description..."
                  value={newCardDescription}
                  onChange={(e) => setNewCardDescription(e.target.value)}
                  className="w-full border rounded px-3 py-2 resize-none focus:ring-2 focus:ring-blue-500"
                  rows="4"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={cardPriority}
                    onChange={(e) => setCardPriority(e.target.value)}
                    className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={cardDueDate}
                    onChange={(e) => setCardDueDate(e.target.value)}
                    className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assignee</label>
                <input
                  type="text"
                  placeholder="Enter assignee name"
                  value={cardAssignee}
                  onChange={(e) => setCardAssignee(e.target.value)}
                  className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Labels</label>
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {cardLabels.map(label => (
                      <span key={label} className={`px-3 py-1 rounded-full text-sm border ${getLabelColor(label)} flex items-center gap-1`}>
                        {label}
                        <button onClick={() => removeLabel(label)} className="hover:bg-white/20 rounded">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  {cardLabels.length < 6 && (
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          addLabel(e.target.value);
                          e.target.value = '';
                        }
                      }}
                      className="border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Add label...</option>
                      {availableLabels.filter(label => !cardLabels.includes(label)).map(label => (
                        <option key={label} value={label}>{label}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
              
              <div className="flex gap-3 pt-4 border-t">
                <button
                  onClick={handleUpdateCard}
                  className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex-1"
                >
                  Update Card
                </button>
                <button
                  onClick={() => {
                    setEditingCard(null);
                    setNewCardTitle('');
                    setNewCardDescription('');
                    setCardPriority('medium');
                    setCardAssignee('');
                    setCardDueDate('');
                    setCardLabels([]);
                  }}
                  className="px-6 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Card Details Modal */}
      {showCardDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">{showCardDetails.title}</h3>
              <button
                onClick={() => setShowCardDetails(null)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              {showCardDetails.description && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Description</h4>
                  <p className="text-gray-600 bg-gray-50 p-3 rounded">{showCardDetails.description}</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Priority</h4>
                  <div className="flex items-center gap-2">
                    <Flag className={`w-4 h-4 ${showCardDetails.priority === 'urgent' ? 'text-red-500' : showCardDetails.priority === 'high' ? 'text-orange-500' : showCardDetails.priority === 'medium' ? 'text-blue-500' : 'text-green-500'}`} />
                    <span className="capitalize">{showCardDetails.priority}</span>
                  </div>
                </div>
                
                {showCardDetails.assignee && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Assignee</h4>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-500" />
                      <span>{showCardDetails.assignee}</span>
                    </div>
                  </div>
                )}
              </div>
              
              {showCardDetails.dueDate && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Due Date</h4>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className={new Date(showCardDetails.dueDate) < new Date() ? 'text-red-600 font-medium' : ''}>
                      {new Date(showCardDetails.dueDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              )}
              
              {showCardDetails.labels && showCardDetails.labels.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Labels</h4>
                  <div className="flex flex-wrap gap-2">
                    {showCardDetails.labels.map(label => (
                      <span key={label} className={`px-3 py-1 rounded-full text-sm border ${getLabelColor(label)}`}>
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="text-sm text-gray-500 pt-4 border-t">
                <p>Created: {new Date(showCardDetails.createdAt).toLocaleDateString()}</p>
                {showCardDetails.updatedAt && showCardDetails.updatedAt !== showCardDetails.createdAt && (
                  <p>Updated: {new Date(showCardDetails.updatedAt).toLocaleDateString()}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
