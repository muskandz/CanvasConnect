import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Plus, X, Edit3, Trash2, User, Calendar, 
  ArrowLeft, Save, MoreHorizontal, Flag, GripVertical
} from 'lucide-react';

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
  const [editingCard, setEditingCard] = useState(null);
  const [showNewCardForm, setShowNewCardForm] = useState(null);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [newCardDescription, setNewCardDescription] = useState('');
  const [draggedCard, setDraggedCard] = useState(null);
  const [draggedFrom, setDraggedFrom] = useState(null);

  // Load board data
  useEffect(() => {
    const loadBoard = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/boards/${id}`);
        const boardData = res.data;
        
        if (boardData.data) {
          try {
            const parsedData = typeof boardData.data === 'string' 
              ? JSON.parse(boardData.data) 
              : boardData.data;
              
            if (parsedData.columns) {
              setBoard({
                title: boardData.title || 'Kanban Board',
                columns: parsedData.columns
              });
            }
          } catch (e) {
            console.error('Failed to parse kanban data:', e);
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
      await axios.put('http://localhost:5000/api/boards/update', {
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

    const newColumns = board.columns.map(col => {
      if (col.id === draggedFrom) {
        return {
          ...col,
          cards: col.cards.filter(card => card.id !== draggedCard.id)
        };
      }
      if (col.id === targetColumnId) {
        return {
          ...col,
          cards: [...col.cards, draggedCard]
        };
      }
      return col;
    });

    setBoard({ ...board, columns: newColumns });
    setDraggedCard(null);
    setDraggedFrom(null);
  };

  // Add new card
  const addCard = (columnId) => {
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

    const newColumns = board.columns.map(col => 
      col.id === columnId 
        ? { ...col, cards: [...col.cards, newCard] }
        : col
    );

    setBoard({ ...board, columns: newColumns });
    setNewCardTitle('');
    setNewCardDescription('');
    setShowNewCardForm(null);
  };

  // Update card
  const updateCard = (columnId, cardId, updates) => {
    const newColumns = board.columns.map(col => 
      col.id === columnId 
        ? {
            ...col,
            cards: col.cards.map(card => 
              card.id === cardId ? { ...card, ...updates } : card
            )
          }
        : col
    );
    setBoard({ ...board, columns: newColumns });
  };

  // Delete card
  const deleteCard = (columnId, cardId) => {
    const newColumns = board.columns.map(col => 
      col.id === columnId 
        ? { ...col, cards: col.cards.filter(card => card.id !== cardId) }
        : col
    );
    setBoard({ ...board, columns: newColumns });
  };

  // Update column title
  const updateColumnTitle = (columnId, newTitle) => {
    const newColumns = board.columns.map(col => 
      col.id === columnId ? { ...col, title: newTitle } : col
    );
    setBoard({ ...board, columns: newColumns });
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading kanban board...</div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
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
              value={board.title}
              onChange={(e) => setBoard({ ...board, title: e.target.value })}
              className="text-2xl font-bold bg-transparent border-none outline-none"
              onBlur={saveBoard}
            />
            
            <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
              Kanban Board
            </div>
          </div>
          
          <button
            onClick={saveBoard}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Save className="w-4 h-4" />
            Save
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 p-6 overflow-x-auto">
        <div className="flex gap-6 min-w-fit">
          {board.columns.map((column) => (
            <div
              key={column.id}
              className="bg-white rounded-lg shadow-sm border w-80 flex-shrink-0"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              {/* Column Header */}
              <div className="p-4 border-b" style={{ backgroundColor: column.color || '#f9fafb' }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={column.title}
                      onChange={(e) => updateColumnTitle(column.id, e.target.value)}
                      className="font-semibold text-gray-800 bg-transparent border-none outline-none"
                      onBlur={saveBoard}
                    />
                    <span className="text-sm text-gray-500">({column.cards.length})</span>
                  </div>
                  <button
                    onClick={() => setShowNewCardForm(column.id)}
                    className="p-1 hover:bg-white/50 rounded"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-4 min-h-[200px] max-h-[600px] overflow-y-auto space-y-3">
                {/* New Card Form */}
                {showNewCardForm === column.id && (
                  <div className="bg-gray-50 p-3 rounded-lg border-2 border-dashed">
                    <input
                      type="text"
                      placeholder="Card title..."
                      value={newCardTitle}
                      onChange={(e) => setNewCardTitle(e.target.value)}
                      className="w-full p-2 border rounded mb-2"
                      autoFocus
                    />
                    <textarea
                      placeholder="Description (optional)..."
                      value={newCardDescription}
                      onChange={(e) => setNewCardDescription(e.target.value)}
                      className="w-full p-2 border rounded mb-2 h-20 resize-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => addCard(column.id)}
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
                {column.cards.map((card) => (
                  <div
                    key={card.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, card, column.id)}
                    className="bg-white p-3 rounded-lg border shadow-sm hover:shadow-md transition-shadow cursor-move select-none"
                  >
                    <div className="flex items-start gap-2">
                      <GripVertical className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
                      <div className="flex-1">
                        {editingCard === card.id ? (
                          <EditCardForm 
                            card={card}
                            onSave={(updates) => {
                              updateCard(column.id, card.id, updates);
                              setEditingCard(null);
                            }}
                            onCancel={() => setEditingCard(null)}
                          />
                        ) : (
                          <CardView 
                            card={card}
                            onEdit={() => setEditingCard(card.id)}
                            onDelete={() => deleteCard(column.id, card.id)}
                            getPriorityColor={getPriorityColor}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Card View Component
const CardView = ({ card, onEdit, onDelete, getPriorityColor }) => (
  <div>
    <div className="flex items-start justify-between mb-2">
      <h4 className="font-medium text-gray-900 flex-1">{card.title}</h4>
      <div className="flex items-center gap-1 ml-2">
        <button
          onClick={onEdit}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <Edit3 className="w-3 h-3" />
        </button>
        <button
          onClick={onDelete}
          className="p-1 hover:bg-gray-100 rounded text-red-600"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
    
    {card.description && (
      <p className="text-sm text-gray-600 mb-3">{card.description}</p>
    )}
    
    <div className="flex items-center justify-between text-xs">
      <div className="flex items-center gap-2">
        <span className={`px-2 py-1 rounded-full border ${getPriorityColor(card.priority)}`}>
          <Flag className="w-3 h-3 inline mr-1" />
          {card.priority}
        </span>
      </div>
      
      {card.dueDate && (
        <div className="flex items-center gap-1 text-gray-500">
          <Calendar className="w-3 h-3" />
          <span>{new Date(card.dueDate).toLocaleDateString()}</span>
        </div>
      )}
    </div>
  </div>
);

// Edit Card Form Component
const EditCardForm = ({ card, onSave, onCancel }) => {
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description || '');
  const [priority, setPriority] = useState(card.priority || 'medium');
  const [assignee, setAssignee] = useState(card.assignee || '');
  const [dueDate, setDueDate] = useState(card.dueDate || '');

  const handleSave = () => {
    onSave({ title, description, priority, assignee, dueDate });
  };

  return (
    <div className="space-y-3">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full p-2 border rounded text-sm font-medium"
        placeholder="Card title"
        autoFocus
      />
      
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full p-2 border rounded text-sm h-20 resize-none"
        placeholder="Description"
      />
      
      <div className="grid grid-cols-2 gap-2">
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="p-2 border rounded text-sm"
        >
          <option value="low">Low Priority</option>
          <option value="medium">Medium Priority</option>
          <option value="high">High Priority</option>
        </select>
        
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="p-2 border rounded text-sm"
        />
      </div>
      
      <input
        type="text"
        value={assignee}
        onChange={(e) => setAssignee(e.target.value)}
        placeholder="Assignee"
        className="w-full p-2 border rounded text-sm"
      />
      
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
        >
          Save
        </button>
        <button
          onClick={onCancel}
          className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};
