import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeft, Save, Plus, Trash2, Edit3, 
  Users, Clock, CheckSquare, Square, 
  MessageCircle, AlertCircle, User, Calendar
} from 'lucide-react';

export default function MeetingEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [meeting, setMeeting] = useState({
    title: 'Meeting Notes',
    date: new Date().toISOString().split('T')[0],
    startTime: '',
    endTime: '',
    attendees: [],
    agenda: [],
    notes: [],
    actionItems: [],
    decisions: [],
    nextSteps: []
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('agenda');
  const [newItem, setNewItem] = useState('');
  const [newAttendee, setNewAttendee] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [meetingTimer, setMeetingTimer] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  const sections = {
    agenda: { title: 'Agenda', icon: Calendar, color: 'blue' },
    notes: { title: 'Notes', icon: MessageCircle, color: 'green' },
    decisions: { title: 'Decisions', icon: AlertCircle, color: 'purple' },
    actions: { title: 'Action Items', icon: CheckSquare, color: 'orange' },
    next: { title: 'Next Steps', icon: ArrowLeft, color: 'red' }
  };

  // Load meeting data
  useEffect(() => {
    const loadMeeting = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/boards/${id}`);
        const boardData = res.data;
        
        if (boardData.data) {
          try {
            const parsedData = typeof boardData.data === 'string' 
              ? JSON.parse(boardData.data) 
              : boardData.data;
              
            if (parsedData.agenda !== undefined) {
              setMeeting(prev => ({
                ...prev,
                title: boardData.title || 'Meeting Notes',
                ...parsedData
              }));
            }
          } catch (e) {
            console.error('Failed to parse meeting data:', e);
          }
        }
      } catch (error) {
        console.error('Failed to load meeting:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadMeeting();
  }, [id]);

  // Save meeting
  const saveMeeting = async () => {
    try {
      await axios.put('http://localhost:5000/api/boards/update', {
        boardId: id,
        title: meeting.title,
        data: JSON.stringify({
          date: meeting.date,
          startTime: meeting.startTime,
          endTime: meeting.endTime,
          attendees: meeting.attendees,
          agenda: meeting.agenda,
          notes: meeting.notes,
          actionItems: meeting.actionItems,
          decisions: meeting.decisions,
          nextSteps: meeting.nextSteps
        }),
        templateType: 'meeting'
      });
    } catch (error) {
      console.error('Failed to save meeting:', error);
    }
  };

  // Auto-save
  useEffect(() => {
    const interval = setInterval(saveMeeting, 10000);
    return () => clearInterval(interval);
  }, [meeting]);

  // Timer functionality
  useEffect(() => {
    if (meetingTimer) {
      const interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [meetingTimer]);

  // Add attendee
  const addAttendee = () => {
    if (!newAttendee.trim()) return;
    
    const attendee = {
      id: Date.now().toString(),
      name: newAttendee.trim(),
      role: '',
      present: true
    };
    
    setMeeting(prev => ({
      ...prev,
      attendees: [...prev.attendees, attendee]
    }));
    
    setNewAttendee('');
  };

  // Remove attendee
  const removeAttendee = (attendeeId) => {
    setMeeting(prev => ({
      ...prev,
      attendees: prev.attendees.filter(a => a.id !== attendeeId)
    }));
  };

  // Add item to section
  const addItem = (section) => {
    if (!newItem.trim()) return;
    
    const item = {
      id: Date.now().toString(),
      text: newItem.trim(),
      timestamp: new Date().toISOString(),
      completed: section === 'actions' ? false : undefined,
      assignee: section === 'actions' ? '' : undefined,
      dueDate: section === 'actions' ? '' : undefined,
      priority: section === 'actions' ? 'medium' : undefined
    };
    
    const sectionKey = section === 'actions' ? 'actionItems' : section === 'next' ? 'nextSteps' : section;
    
    setMeeting(prev => ({
      ...prev,
      [sectionKey]: [...prev[sectionKey], item]
    }));
    
    setNewItem('');
  };

  // Update item
  const updateItem = (section, itemId, updates) => {
    const sectionKey = section === 'actions' ? 'actionItems' : section === 'next' ? 'nextSteps' : section;
    
    setMeeting(prev => ({
      ...prev,
      [sectionKey]: prev[sectionKey].map(item =>
        item.id === itemId ? { ...item, ...updates } : item
      )
    }));
  };

  // Remove item
  const removeItem = (section, itemId) => {
    const sectionKey = section === 'actions' ? 'actionItems' : section === 'next' ? 'nextSteps' : section;
    
    setMeeting(prev => ({
      ...prev,
      [sectionKey]: prev[sectionKey].filter(item => item.id !== itemId)
    }));
  };

  // Toggle action item completion
  const toggleActionItem = (itemId) => {
    updateItem('actions', itemId, {
      completed: !meeting.actionItems.find(item => item.id === itemId).completed
    });
  };

  // Start/stop meeting timer
  const toggleTimer = () => {
    if (meetingTimer) {
      setMeetingTimer(null);
      setMeeting(prev => ({ ...prev, endTime: new Date().toLocaleTimeString() }));
    } else {
      setMeetingTimer(true);
      setElapsedTime(0);
      setMeeting(prev => ({ ...prev, startTime: new Date().toLocaleTimeString() }));
    }
  };

  // Format time
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get current section data
  const getCurrentSectionData = () => {
    switch (activeSection) {
      case 'agenda': return meeting.agenda;
      case 'notes': return meeting.notes;
      case 'decisions': return meeting.decisions;
      case 'actions': return meeting.actionItems;
      case 'next': return meeting.nextSteps;
      default: return [];
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading meeting notes...</div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r flex flex-col">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            
            <div className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium">
              Meeting
            </div>
          </div>
          
          <input
            type="text"
            value={meeting.title}
            onChange={(e) => setMeeting(prev => ({ ...prev, title: e.target.value }))}
            className="w-full text-xl font-bold bg-transparent border-none outline-none mb-4"
            onBlur={saveMeeting}
          />
          
          {/* Meeting Details */}
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Date</label>
              <input
                type="date"
                value={meeting.date}
                onChange={(e) => setMeeting(prev => ({ ...prev, date: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Start</label>
                <input
                  type="time"
                  value={meeting.startTime}
                  onChange={(e) => setMeeting(prev => ({ ...prev, startTime: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">End</label>
                <input
                  type="time"
                  value={meeting.endTime}
                  onChange={(e) => setMeeting(prev => ({ ...prev, endTime: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
            </div>
            
            {/* Timer */}
            <div className="flex items-center justify-between">
              <button
                onClick={toggleTimer}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                  meetingTimer 
                    ? 'bg-red-100 text-red-800 hover:bg-red-200' 
                    : 'bg-green-100 text-green-800 hover:bg-green-200'
                }`}
              >
                <Clock className="w-4 h-4" />
                {meetingTimer ? 'Stop Meeting' : 'Start Meeting'}
              </button>
              
              {meetingTimer && (
                <div className="font-mono font-bold text-lg text-blue-600">
                  {formatTime(elapsedTime)}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Attendees */}
        <div className="p-6 border-b">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4" />
            <span className="font-medium">Attendees ({meeting.attendees.length})</span>
          </div>
          
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              placeholder="Add attendee..."
              value={newAttendee}
              onChange={(e) => setNewAttendee(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addAttendee()}
              className="flex-1 px-3 py-2 border rounded-lg text-sm"
            />
            <button
              onClick={addAttendee}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-2">
            {meeting.attendees.map(attendee => (
              <div key={attendee.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">{attendee.name}</span>
                </div>
                <button
                  onClick={() => removeAttendee(attendee.id)}
                  className="text-red-600 hover:bg-red-100 p-1 rounded"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
        
        {/* Section Navigation */}
        <div className="flex-1 p-6">
          <div className="space-y-2">
            {Object.entries(sections).map(([key, section]) => {
              const Icon = section.icon;
              const isActive = activeSection === key;
              
              return (
                <button
                  key={key}
                  onClick={() => setActiveSection(key)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    isActive 
                      ? `bg-${section.color}-100 text-${section.color}-800 border border-${section.color}-200` 
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium">{section.title}</span>
                  <span className="ml-auto text-xs bg-gray-200 px-2 py-1 rounded-full">
                    {getCurrentSectionData().length}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        
        <div className="p-6 border-t">
          <button
            onClick={saveMeeting}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Save className="w-4 h-4" />
            Save Meeting
          </button>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Section Header */}
        <div className="bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {React.createElement(sections[activeSection].icon, { className: "w-6 h-6" })}
              <h2 className="text-2xl font-bold">{sections[activeSection].title}</h2>
            </div>
            
            <div className="text-sm text-gray-500">
              {getCurrentSectionData().length} items
            </div>
          </div>
        </div>
        
        {/* Add Item */}
        <div className="bg-white border-b px-6 py-4">
          <div className="flex gap-4">
            <input
              type="text"
              placeholder={`Add ${sections[activeSection].title.toLowerCase()}...`}
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addItem(activeSection)}
              className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => addItem(activeSection)}
              disabled={!newItem.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>
        </div>
        
        {/* Items List */}
        <div className="flex-1 overflow-auto p-6">
          <div className="space-y-4">
            {getCurrentSectionData().map(item => (
              <div key={item.id} className="bg-white border rounded-lg p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {activeSection === 'actions' && (
                      <div className="flex items-center gap-2 mb-2">
                        <button
                          onClick={() => toggleActionItem(item.id)}
                          className={`${item.completed ? 'text-green-600' : 'text-gray-400'}`}
                        >
                          {item.completed ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                        </button>
                      </div>
                    )}
                    
                    {editingItem === item.id ? (
                      <textarea
                        value={item.text}
                        onChange={(e) => updateItem(activeSection, item.id, { text: e.target.value })}
                        onBlur={() => setEditingItem(null)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            setEditingItem(null);
                            e.preventDefault();
                          }
                        }}
                        className="w-full p-2 border rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows="3"
                        autoFocus
                      />
                    ) : (
                      <p className={`text-gray-800 leading-relaxed ${
                        activeSection === 'actions' && item.completed ? 'line-through text-gray-500' : ''
                      }`}>
                        {item.text}
                      </p>
                    )}
                    
                    {activeSection === 'actions' && (
                      <div className="mt-2 flex gap-4">
                        <input
                          type="text"
                          placeholder="Assignee"
                          value={item.assignee || ''}
                          onChange={(e) => updateItem(activeSection, item.id, { assignee: e.target.value })}
                          className="px-2 py-1 border rounded text-sm"
                        />
                        <input
                          type="date"
                          value={item.dueDate || ''}
                          onChange={(e) => updateItem(activeSection, item.id, { dueDate: e.target.value })}
                          className="px-2 py-1 border rounded text-sm"
                        />
                        <select
                          value={item.priority || 'medium'}
                          onChange={(e) => updateItem(activeSection, item.id, { priority: e.target.value })}
                          className="px-2 py-1 border rounded text-sm"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => setEditingItem(item.id)}
                      className="p-2 hover:bg-gray-100 rounded"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => removeItem(activeSection, item.id)}
                      className="p-2 hover:bg-gray-100 rounded text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="text-xs text-gray-500 mt-2">
                  {new Date(item.timestamp).toLocaleString()}
                </div>
              </div>
            ))}
            
            {getCurrentSectionData().length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  {React.createElement(sections[activeSection].icon, { className: "w-8 h-8" })}
                </div>
                <p className="text-lg mb-2">No {sections[activeSection].title.toLowerCase()} yet</p>
                <p>Add your first item using the input above</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
