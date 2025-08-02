import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeft, Save, Plus, Trash2, Edit3, 
  Lightbulb, Star, CheckCircle, Clock, Users, Target
} from 'lucide-react';

export default function BrainstormingEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [brainstorming, setBrainstorming] = useState({
    title: 'Brainstorming Session',
    topic: '',
    ideas: [],
    categories: ['Ideas', 'Questions', 'Actions', 'Insights'],
    phase: 'divergent', // divergent, convergent, action
    settings: {
      timerMinutes: 25,
      allowVoting: true,
      anonymousMode: false
    }
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [newIdea, setNewIdea] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Ideas');
  const [editingIdea, setEditingIdea] = useState(null);
  const [timer, setTimer] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  const phaseInfo = {
    divergent: {
      title: 'Divergent Thinking',
      description: 'Generate as many ideas as possible without judgment',
      color: 'bg-green-100 text-green-800',
      icon: Lightbulb
    },
    convergent: {
      title: 'Convergent Thinking', 
      description: 'Evaluate and refine ideas',
      color: 'bg-blue-100 text-blue-800',
      icon: Target
    },
    action: {
      title: 'Action Planning',
      description: 'Create concrete action steps',
      color: 'bg-purple-100 text-purple-800',
      icon: CheckCircle
    }
  };

  const categoryColors = {
    'Ideas': 'bg-yellow-100 border-yellow-300 text-yellow-800',
    'Questions': 'bg-blue-100 border-blue-300 text-blue-800',
    'Actions': 'bg-green-100 border-green-300 text-green-800',
    'Insights': 'bg-purple-100 border-purple-300 text-purple-800'
  };

  // Load brainstorming data
  useEffect(() => {
    const loadBrainstorming = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/boards/${id}`);
        const boardData = res.data;
        
        if (boardData.data) {
          try {
            const parsedData = typeof boardData.data === 'string' 
              ? JSON.parse(boardData.data) 
              : boardData.data;
              
            if (parsedData.ideas) {
              setBrainstorming(prev => ({
                ...prev,
                title: boardData.title || 'Brainstorming Session',
                ...parsedData
              }));
            }
          } catch (e) {
            console.error('Failed to parse brainstorming data:', e);
          }
        }
      } catch (error) {
        console.error('Failed to load brainstorming session:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadBrainstorming();
  }, [id]);

  // Save brainstorming
  const saveBrainstorming = async () => {
    try {
      await axios.put('http://localhost:5000/api/boards/update', {
        boardId: id,
        title: brainstorming.title,
        data: JSON.stringify({
          topic: brainstorming.topic,
          ideas: brainstorming.ideas,
          categories: brainstorming.categories,
          phase: brainstorming.phase,
          settings: brainstorming.settings
        }),
        templateType: 'brainstorming'
      });
    } catch (error) {
      console.error('Failed to save brainstorming session:', error);
    }
  };

  // Auto-save
  useEffect(() => {
    const interval = setInterval(saveBrainstorming, 10000);
    return () => clearInterval(interval);
  }, [brainstorming]);

  // Timer functionality
  useEffect(() => {
    if (timer && timeLeft > 0) {
      const interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setTimer(null);
            alert('Time\'s up! Move to the next phase.');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [timer, timeLeft]);

  // Add new idea
  const addIdea = () => {
    if (!newIdea.trim()) return;
    
    const idea = {
      id: Date.now().toString(),
      text: newIdea.trim(),
      category: selectedCategory,
      author: 'Anonymous',
      timestamp: new Date().toISOString(),
      votes: 0,
      tags: [],
      priority: 'medium'
    };
    
    setBrainstorming(prev => ({
      ...prev,
      ideas: [...prev.ideas, idea]
    }));
    
    setNewIdea('');
  };

  // Update idea
  const updateIdea = (ideaId, updates) => {
    setBrainstorming(prev => ({
      ...prev,
      ideas: prev.ideas.map(idea =>
        idea.id === ideaId ? { ...idea, ...updates } : idea
      )
    }));
  };

  // Delete idea
  const deleteIdea = (ideaId) => {
    setBrainstorming(prev => ({
      ...prev,
      ideas: prev.ideas.filter(idea => idea.id !== ideaId)
    }));
  };

  // Vote for idea
  const voteIdea = (ideaId) => {
    if (!brainstorming.settings.allowVoting) return;
    
    updateIdea(ideaId, {
      votes: brainstorming.ideas.find(i => i.id === ideaId).votes + 1
    });
  };

  // Start timer
  const startTimer = () => {
    setTimeLeft(brainstorming.settings.timerMinutes * 60);
    setTimer(true);
  };

  // Stop timer
  const stopTimer = () => {
    setTimer(null);
    setTimeLeft(0);
  };

  // Format time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Filter and sort ideas
  const getFilteredIdeas = () => {
    let filtered = brainstorming.ideas;
    
    if (filterCategory !== 'all') {
      filtered = filtered.filter(idea => idea.category === filterCategory);
    }
    
    switch (sortBy) {
      case 'votes':
        return filtered.sort((a, b) => b.votes - a.votes);
      case 'newest':
        return filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      case 'oldest':
        return filtered.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      case 'category':
        return filtered.sort((a, b) => a.category.localeCompare(b.category));
      default:
        return filtered;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading brainstorming session...</div>
      </div>
    );
  }

  const currentPhase = phaseInfo[brainstorming.phase];
  const PhaseIcon = currentPhase.icon;

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
              value={brainstorming.title}
              onChange={(e) => setBrainstorming(prev => ({ ...prev, title: e.target.value }))}
              className="text-2xl font-bold bg-transparent border-none outline-none"
              onBlur={saveBrainstorming}
            />
            
            <div className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
              Brainstorming
            </div>
            
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${currentPhase.color}`}>
              <PhaseIcon className="w-4 h-4 inline mr-1" />
              {currentPhase.title}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {timer && (
              <div className="flex items-center gap-2 px-3 py-2 bg-orange-100 text-orange-800 rounded-lg">
                <Clock className="w-4 h-4" />
                <span className="font-mono font-bold">{formatTime(timeLeft)}</span>
                <button
                  onClick={stopTimer}
                  className="text-xs hover:underline"
                >
                  Stop
                </button>
              </div>
            )}
            
            <button
              onClick={saveBrainstorming}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Save className="w-4 h-4" />
              Save
            </button>
          </div>
        </div>
        
        {/* Topic */}
        <div className="mt-4">
          <input
            type="text"
            placeholder="What are you brainstorming about?"
            value={brainstorming.topic}
            onChange={(e) => setBrainstorming(prev => ({ ...prev, topic: e.target.value }))}
            className="w-full text-lg text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Phase Selector */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Phase:</label>
              <select
                value={brainstorming.phase}
                onChange={(e) => setBrainstorming(prev => ({ ...prev, phase: e.target.value }))}
                className="px-3 py-1 border rounded-lg text-sm"
              >
                <option value="divergent">Divergent Thinking</option>
                <option value="convergent">Convergent Thinking</option>
                <option value="action">Action Planning</option>
              </select>
            </div>
            
            {/* Timer Controls */}
            <div className="flex items-center gap-2">
              {!timer ? (
                <>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={brainstorming.settings.timerMinutes}
                    onChange={(e) => setBrainstorming(prev => ({
                      ...prev,
                      settings: { ...prev.settings, timerMinutes: parseInt(e.target.value) || 25 }
                    }))}
                    className="w-16 px-2 py-1 border rounded text-sm text-center"
                  />
                  <span className="text-sm text-gray-600">min</span>
                  <button
                    onClick={startTimer}
                    className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                  >
                    <Clock className="w-3 h-3" />
                    Start Timer
                  </button>
                </>
              ) : null}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Filter */}
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-1 border rounded-lg text-sm"
            >
              <option value="all">All Categories</option>
              {brainstorming.categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            
            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1 border rounded-lg text-sm"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="votes">Most Voted</option>
              <option value="category">By Category</option>
            </select>
            
            <div className="text-sm text-gray-500">
              {getFilteredIdeas().length} ideas
            </div>
          </div>
        </div>
        
        <div className="mt-2 text-xs text-gray-500">
          {currentPhase.description}
        </div>
      </div>

      {/* Add Idea */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center gap-4">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border rounded-lg"
          >
            {brainstorming.categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          
          <div className="flex-1 flex gap-2">
            <input
              type="text"
              placeholder="Share your idea..."
              value={newIdea}
              onChange={(e) => setNewIdea(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addIdea()}
              className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={addIdea}
              disabled={!newIdea.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
              Add Idea
            </button>
          </div>
        </div>
      </div>

      {/* Ideas Grid */}
      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {getFilteredIdeas().map(idea => (
            <div
              key={idea.id}
              className={`p-4 rounded-lg border-2 ${categoryColors[idea.category]} bg-white`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className={`px-2 py-1 rounded text-xs font-medium ${categoryColors[idea.category]}`}>
                  {idea.category}
                </div>
                
                <div className="flex items-center gap-1">
                  {brainstorming.settings.allowVoting && (
                    <button
                      onClick={() => voteIdea(idea.id)}
                      className="flex items-center gap-1 px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs"
                    >
                      <Star className="w-3 h-3" />
                      {idea.votes}
                    </button>
                  )}
                  
                  <button
                    onClick={() => setEditingIdea(idea.id)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <Edit3 className="w-3 h-3" />
                  </button>
                  
                  <button
                    onClick={() => deleteIdea(idea.id)}
                    className="p-1 hover:bg-gray-100 rounded text-red-600"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
              
              {editingIdea === idea.id ? (
                <textarea
                  value={idea.text}
                  onChange={(e) => updateIdea(idea.id, { text: e.target.value })}
                  onBlur={() => setEditingIdea(null)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      setEditingIdea(null);
                      e.preventDefault();
                    }
                  }}
                  className="w-full p-2 border rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  autoFocus
                />
              ) : (
                <p className="text-gray-800 mb-3 leading-relaxed">{idea.text}</p>
              )}
              
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{idea.author}</span>
                <span>{new Date(idea.timestamp).toLocaleTimeString()}</span>
              </div>
            </div>
          ))}
          
          {getFilteredIdeas().length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-500">
              <Lightbulb className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">No ideas yet</p>
              <p>Start brainstorming by adding your first idea above!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
