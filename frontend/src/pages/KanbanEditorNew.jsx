import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient, API_ENDPOINTS } from "../config/api";
import { ArrowLeft, Plus, Edit3, Trash2, GripVertical, Calendar, User } from 'lucide-react';

export default function KanbanEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [board, setBoard] = useState({
    title: 'Kanban Board',
    columns: [
      { id: 'todo', title: 'To Do', cards: [], color: '#f3f4f6' },
      { id: 'inprogress', title: 'In Progress', cards: [], color: '#fef3c7' },
      { id: 'done', title: 'Done', cards: [], color: '#d1fae5' }
    ]
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [showNewCardForm, setShowNewCardForm] = useState(null);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [newCardDescription, setNewCardDescription] = useState('');
  const [editingCard, setEditingCard] = useState(null);
  const [draggedCard, setDraggedCard] = useState(null);
  const [draggedFrom, setDraggedFrom] = useState(null);

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
      priority: 'medium',
      assignee: '',
      dueDate: '',
      createdAt: new Date().toISOString()
    };

    setBoard(prev => ({
      ...prev,
      columns: prev.columns.map(col =>
        col.id === columnId
          ? { ...col, cards: [...col.cards, newCard] }
          : col
      )
    }));

    setNewCardTitle('');
    setNewCardDescription('');
    setShowNewCardForm(null);
  };

  // Edit card
  const handleEditCard = (card) => {
    setEditingCard(card);
    setNewCardTitle(card.title);
    setNewCardDescription(card.description || '');
  };

  const handleUpdateCard = () => {
    if (!newCardTitle.trim()) return;

    setBoard(prev => ({
      ...prev,
      columns: prev.columns.map(col => ({
        ...col,
        cards: col.cards.map(card =>
          card.id === editingCard.id
            ? { ...card, title: newCardTitle, description: newCardDescription }
            : card
        )
      }))
    }));

    setEditingCard(null);
    setNewCardTitle('');
    setNewCardDescription('');
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
              className="w-80 bg-gray-100 rounded-lg p-4 flex flex-col"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: column.color }}
                  ></div>
                  {column.title}
                  <span className="bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded-full">
                    {column.cards.length}
                  </span>
                </h3>
                <button
                  onClick={() => setShowNewCardForm(column.id)}
                  className="p-1 hover:bg-gray-200 rounded"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Add Card Form */}
              {showNewCardForm === column.id && (
                <div className="bg-white p-3 rounded-lg border mb-3">
                  <input
                    type="text"
                    placeholder="Card title"
                    value={newCardTitle}
                    onChange={(e) => setNewCardTitle(e.target.value)}
                    className="w-full border rounded px-3 py-2 mb-2 text-sm"
                    autoFocus
                  />
                  <textarea
                    placeholder="Description (optional)"
                    value={newCardDescription}
                    onChange={(e) => setNewCardDescription(e.target.value)}
                    className="w-full border rounded px-3 py-2 mb-3 text-sm resize-none"
                    rows="2"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAddCard(column.id)}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                    >
                      Add Card
                    </button>
                    <button
                      onClick={() => {
                        setShowNewCardForm(null);
                        setNewCardTitle('');
                        setNewCardDescription('');
                      }}
                      className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Cards */}
              <div className="flex-1 space-y-3 overflow-y-auto">
                {column.cards.map((card) => (
                  <div
                    key={card.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, card, column.id)}
                    className="bg-white p-3 rounded-lg border shadow-sm hover:shadow-md transition-shadow cursor-move select-none"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <GripVertical className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
                      <div className="flex-1 mx-2">
                        <h4 className="font-medium text-gray-900">{card.title}</h4>
                        {card.description && (
                          <p className="text-sm text-gray-600 mt-1">{card.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEditCard(card)}
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDeleteCard(card.id)}
                          className="p-1 hover:bg-gray-100 rounded text-red-600"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full border ${getPriorityColor(card.priority)}`}>
                          {card.priority}
                        </span>
                        {card.assignee && (
                          <div className="flex items-center gap-1 text-gray-500">
                            <User className="w-3 h-3" />
                            <span>{card.assignee}</span>
                          </div>
                        )}
                      </div>
                      {card.dueDate && (
                        <div className="flex items-center gap-1 text-gray-500">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(card.dueDate).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Card Modal */}
      {editingCard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Edit Card</h3>
            <input
              type="text"
              placeholder="Card title"
              value={newCardTitle}
              onChange={(e) => setNewCardTitle(e.target.value)}
              className="w-full border rounded px-3 py-2 mb-3"
            />
            <textarea
              placeholder="Description"
              value={newCardDescription}
              onChange={(e) => setNewCardDescription(e.target.value)}
              className="w-full border rounded px-3 py-2 mb-4 resize-none"
              rows="3"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={handleUpdateCard}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Update
              </button>
              <button
                onClick={() => {
                  setEditingCard(null);
                  setNewCardTitle('');
                  setNewCardDescription('');
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
