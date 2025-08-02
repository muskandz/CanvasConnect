import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeft, Save, Plus, Trash2, Edit3, Play, 
  ChevronLeft, ChevronRight, Type, Image, 
  List, Bold, Italic, AlignLeft, AlignCenter, AlignRight,
  Maximize, Minimize, Copy, Move, Palette, TextIcon,
  MousePointer, Square, Circle, Triangle, Minus,
  Upload, Download, Share2, Grid3X3, RotateCcw,
  ZoomIn, ZoomOut, Eye, EyeOff, Lock, Unlock
} from 'lucide-react';

export default function PresentationEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [presentation, setPresentation] = useState({
    title: 'Untitled Presentation',
    slides: [
      {
        id: '1',
        title: 'Welcome to Your Presentation',
        subtitle: 'Click to edit this subtitle',
        content: [
          {
            id: '1',
            type: 'text',
            text: 'Click to add content',
            x: 50,
            y: 200,
            width: 400,
            height: 100,
            fontSize: 18,
            fontFamily: 'Arial',
            color: '#333333',
            backgroundColor: 'transparent',
            textAlign: 'left',
            fontWeight: 'normal',
            fontStyle: 'normal'
          }
        ],
        background: '#ffffff',
        backgroundImage: null,
        layout: 'title',
        notes: 'Speaker notes for this slide...'
      }
    ],
    currentSlide: 0,
    theme: 'default'
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [presentationMode, setPresentationMode] = useState(false);
  const [editingElement, setEditingElement] = useState(null);
  const [selectedElement, setSelectedElement] = useState(null);
  const [showToolbar, setShowToolbar] = useState(true);
  const [draggedElement, setDraggedElement] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showGrid, setShowGrid] = useState(false);
  const [slideNotes, setSlideNotes] = useState('');
  const [showNotes, setShowNotes] = useState(false);
  const slideRef = useRef(null);

  // Load presentation data
  useEffect(() => {
    const loadPresentation = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/boards/${id}`);
        const boardData = res.data;
        
        if (boardData.data) {
          try {
            const parsedData = typeof boardData.data === 'string' 
              ? JSON.parse(boardData.data) 
              : boardData.data;
              
            if (parsedData.slides) {
              setPresentation({
                title: boardData.title || 'Untitled Presentation',
                slides: parsedData.slides,
                currentSlide: 0
              });
            }
          } catch (e) {
            console.error('Failed to parse presentation data:', e);
          }
        }
      } catch (error) {
        console.error('Failed to load presentation:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadPresentation();
  }, [id]);

  // Save presentation
  const savePresentation = async () => {
    try {
      await axios.put('http://localhost:5000/api/boards/update', {
        boardId: id,
        title: presentation.title,
        data: JSON.stringify({ slides: presentation.slides }),
        templateType: 'presentation'
      });
    } catch (error) {
      console.error('Failed to save presentation:', error);
    }
  };

  // Auto-save
  useEffect(() => {
    const interval = setInterval(savePresentation, 10000);
    return () => clearInterval(interval);
  }, [presentation]);

  // Add new slide
  const addSlide = (layout = 'content') => {
    const newSlide = {
      id: Date.now().toString(),
      title: 'New Slide',
      subtitle: '',
      content: layout === 'title' ? [] : [
        {
          id: Date.now().toString(),
          type: 'text',
          text: 'Click to edit',
          x: 50,
          y: 150,
          width: 400,
          height: 100,
          fontSize: 16,
          fontFamily: 'Arial',
          color: '#333333',
          backgroundColor: 'transparent',
          textAlign: 'left',
          fontWeight: 'normal',
          fontStyle: 'normal'
        }
      ],
      background: '#ffffff',
      backgroundImage: null,
      layout: layout,
      notes: ''
    };

    setPresentation(prev => ({
      ...prev,
      slides: [...prev.slides, newSlide],
      currentSlide: prev.slides.length
    }));
  };

  // Delete slide
  const deleteSlide = (slideIndex) => {
    if (presentation.slides.length <= 1) return;
    
    if (window.confirm('Are you sure you want to delete this slide?')) {
      setPresentation(prev => ({
        ...prev,
        slides: prev.slides.filter((_, index) => index !== slideIndex),
        currentSlide: Math.min(prev.currentSlide, prev.slides.length - 2)
      }));
    }
  };

  // Duplicate slide
  const duplicateSlide = (slideIndex) => {
    const slideToClone = presentation.slides[slideIndex];
    const duplicatedSlide = {
      ...slideToClone,
      id: Date.now().toString(),
      title: `${slideToClone.title} (Copy)`,
      content: slideToClone.content.map(item => ({
        ...item,
        id: Date.now().toString() + Math.random()
      }))
    };

    setPresentation(prev => ({
      ...prev,
      slides: [
        ...prev.slides.slice(0, slideIndex + 1),
        duplicatedSlide,
        ...prev.slides.slice(slideIndex + 1)
      ],
      currentSlide: slideIndex + 1
    }));
  };

    // Add content element
  const addElement = (type) => {
    const newElement = {
      id: Date.now().toString(),
      type: type,
      text: type === 'text' ? 'New text element' : '',
      x: 100,
      y: 200,
      width: type === 'text' ? 300 : 200,
      height: type === 'text' ? 60 : 200,
      fontSize: 16,
      fontFamily: 'Arial',
      color: '#333333',
      backgroundColor: type === 'shape' ? '#e3f2fd' : 'transparent',
      textAlign: 'left',
      fontWeight: 'normal',
      fontStyle: 'normal',
      borderColor: '#1976d2',
      borderWidth: type === 'shape' ? 2 : 0,
      borderStyle: 'solid',
      borderRadius: type === 'shape' ? 8 : 0,
      opacity: 1,
      rotation: 0
    };

    setPresentation(prev => ({
      ...prev,
      slides: prev.slides.map((slide, index) => 
        index === prev.currentSlide 
          ? { ...slide, content: [...slide.content, newElement] }
          : slide
      )
    }));

    setSelectedElement(newElement.id);
  };

  // Update element
  const updateElement = (elementId, updates) => {
    setPresentation(prev => ({
      ...prev,
      slides: prev.slides.map((slide, index) => 
        index === prev.currentSlide 
          ? {
              ...slide,
              content: slide.content.map(element =>
                element.id === elementId ? { ...element, ...updates } : element
              )
            }
          : slide
      )
    }));
  };

  // Delete element
  const deleteElement = (elementId) => {
    setPresentation(prev => ({
      ...prev,
      slides: prev.slides.map((slide, index) => 
        index === prev.currentSlide 
          ? {
              ...slide,
              content: slide.content.filter(element => element.id !== elementId)
            }
          : slide
      )
    }));
    setSelectedElement(null);
  };

  // Update slide background
  const updateSlideBackground = (color) => {
    setPresentation(prev => ({
      ...prev,
      slides: prev.slides.map((slide, index) => 
        index === prev.currentSlide 
          ? { ...slide, background: color }
          : slide
      )
    }));
  };

  // Update slide
  const updateSlide = (slideIndex, updates) => {
    setPresentation(prev => ({
      ...prev,
      slides: prev.slides.map((slide, index) =>
        index === slideIndex ? { ...slide, ...updates } : slide
      )
    }));
  };

  // Add content to slide
  const addContent = (type) => {
    const currentSlide = presentation.slides[presentation.currentSlide];
    const newContent = {
      id: Date.now().toString(),
      type,
      text: type === 'bullet' ? 'New bullet point' : 'New text',
      style: {}
    };

    updateSlide(presentation.currentSlide, {
      content: [...currentSlide.content, newContent]
    });
  };

  // Update content
  const updateContent = (contentId, updates) => {
    const currentSlide = presentation.slides[presentation.currentSlide];
    const newContent = currentSlide.content.map(item =>
      item.id === contentId ? { ...item, ...updates } : item
    );
    
    updateSlide(presentation.currentSlide, { content: newContent });
  };

  // Delete content
  const deleteContent = (contentId) => {
    const currentSlide = presentation.slides[presentation.currentSlide];
    const newContent = currentSlide.content.filter(item => item.id !== contentId);
    updateSlide(presentation.currentSlide, { content: newContent });
  };

  const currentSlide = presentation.slides[presentation.currentSlide];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading presentation...</div>
      </div>
    );
  }

  if (presentationMode) {
    return (
      <PresentationView 
        presentation={presentation}
        onExit={() => setPresentationMode(false)}
      />
    );
  }

  return (
    <div className="h-screen bg-gray-100 flex">
      {/* Sidebar - Slide Navigator */}
      <div className="w-64 bg-white border-r flex flex-col">
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 hover:bg-gray-100 rounded"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium">Presentation</span>
          </div>
          
          <input
            type="text"
            value={presentation.title}
            onChange={(e) => setPresentation(prev => ({ ...prev, title: e.target.value }))}
            className="w-full p-2 text-sm border rounded"
            onBlur={savePresentation}
          />
        </div>

        {/* Slide Thumbnails */}
        <div className="flex-1 overflow-y-auto p-2">
          {presentation.slides.map((slide, index) => (
            <div
              key={slide.id}
              onClick={() => setPresentation(prev => ({ ...prev, currentSlide: index }))}
              className={`mb-2 p-2 border rounded cursor-pointer transition-colors ${
                index === presentation.currentSlide 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-xs text-gray-500 mb-1">Slide {index + 1}</div>
              <div className="bg-white border rounded p-2 h-20 flex flex-col justify-center">
                <div className="font-medium text-xs truncate">{slide.title}</div>
                {slide.subtitle && (
                  <div className="text-xs text-gray-500 truncate">{slide.subtitle}</div>
                )}
                <div className="text-xs text-gray-400 mt-1">
                  {slide.content.length} items
                </div>
              </div>
              
              {presentation.slides.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteSlide(index);
                  }}
                  className="mt-1 p-1 text-red-500 hover:bg-red-50 rounded text-xs"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
          
          <button
            onClick={addSlide}
            className="w-full p-4 border-2 border-dashed border-gray-300 rounded text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
          >
            <Plus className="w-4 h-4 mx-auto mb-1" />
            <div className="text-xs">Add Slide</div>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="bg-white border-b p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => addContent('text')}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                <Type className="w-4 h-4" />
                Text
              </button>
              
              <button
                onClick={() => addContent('bullet')}
                className="flex items-center gap-2 px-3 py-2 border rounded hover:bg-gray-50"
              >
                <List className="w-4 h-4" />
                Bullet List
              </button>
              
              <button
                onClick={() => addContent('image')}
                className="flex items-center gap-2 px-3 py-2 border rounded hover:bg-gray-50"
              >
                <Image className="w-4 h-4" />
                Image
              </button>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={savePresentation}
                className="flex items-center gap-2 px-3 py-2 border rounded hover:bg-gray-50"
              >
                <Save className="w-4 h-4" />
                Save
              </button>
              
              <button
                onClick={() => setPresentationMode(true)}
                className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                <Play className="w-4 h-4" />
                Present
              </button>
            </div>
          </div>
        </div>

        {/* Slide Editor */}
        <div className="flex-1 p-8 overflow-auto">
          <div className="max-w-4xl mx-auto">
            {/* Slide Canvas */}
            <div 
              className="bg-white shadow-lg border rounded-lg p-8 aspect-[16/9]"
              style={{ backgroundColor: currentSlide.background }}
            >
              {/* Slide Title */}
              <input
                type="text"
                value={currentSlide.title}
                onChange={(e) => updateSlide(presentation.currentSlide, { title: e.target.value })}
                className="w-full text-3xl font-bold mb-4 bg-transparent border-none outline-none focus:bg-gray-50 p-2 rounded"
                placeholder="Slide Title"
              />
              
              {/* Slide Subtitle */}
              {currentSlide.layout === 'title' && (
                <input
                  type="text"
                  value={currentSlide.subtitle || ''}
                  onChange={(e) => updateSlide(presentation.currentSlide, { subtitle: e.target.value })}
                  className="w-full text-xl text-gray-600 mb-6 bg-transparent border-none outline-none focus:bg-gray-50 p-2 rounded"
                  placeholder="Subtitle"
                />
              )}
              
              {/* Slide Content */}
              <div className="space-y-4">
                {currentSlide.content.map((item, index) => (
                  <ContentEditor
                    key={item.id}
                    item={item}
                    onUpdate={(updates) => updateContent(item.id, updates)}
                    onDelete={() => deleteContent(item.id)}
                    isEditing={editingElement === item.id}
                    setEditing={setEditingElement}
                  />
                ))}
              </div>
            </div>
            
            {/* Slide Navigation */}
            <div className="flex items-center justify-center gap-4 mt-6">
              <button
                onClick={() => setPresentation(prev => ({ 
                  ...prev, 
                  currentSlide: Math.max(0, prev.currentSlide - 1) 
                }))}
                disabled={presentation.currentSlide === 0}
                className="p-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <span className="text-sm text-gray-600">
                {presentation.currentSlide + 1} of {presentation.slides.length}
              </span>
              
              <button
                onClick={() => setPresentation(prev => ({ 
                  ...prev, 
                  currentSlide: Math.min(prev.slides.length - 1, prev.currentSlide + 1) 
                }))}
                disabled={presentation.currentSlide === presentation.slides.length - 1}
                className="p-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Content Editor Component
const ContentEditor = ({ item, onUpdate, onDelete, isEditing, setEditing }) => {
  if (item.type === 'bullet') {
    return (
      <div className="flex items-start gap-2">
        <div className="w-2 h-2 bg-gray-600 rounded-full mt-2 flex-shrink-0"></div>
        <div className="flex-1 flex items-center gap-2">
          {isEditing ? (
            <input
              type="text"
              value={item.text}
              onChange={(e) => onUpdate({ text: e.target.value })}
              onBlur={() => setEditing(null)}
              onKeyDown={(e) => e.key === 'Enter' && setEditing(null)}
              className="flex-1 p-1 border rounded"
              autoFocus
            />
          ) : (
            <div 
              onClick={() => setEditing(item.id)}
              className="flex-1 p-1 cursor-text hover:bg-gray-50 rounded"
            >
              {item.text}
            </div>
          )}
          <button
            onClick={onDelete}
            className="p-1 text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  }

  if (item.type === 'text') {
    return (
      <div className="group flex items-center gap-2">
        {isEditing ? (
          <textarea
            value={item.text}
            onChange={(e) => onUpdate({ text: e.target.value })}
            onBlur={() => setEditing(null)}
            className="flex-1 p-2 border rounded resize-none"
            rows="3"
            autoFocus
          />
        ) : (
          <div 
            onClick={() => setEditing(item.id)}
            className="flex-1 p-2 cursor-text hover:bg-gray-50 rounded whitespace-pre-wrap"
          >
            {item.text}
          </div>
        )}
        <button
          onClick={onDelete}
          className="p-1 text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    );
  }

  if (item.type === 'image') {
    return (
      <div className="group border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <Image className="w-12 h-12 mx-auto mb-2 text-gray-400" />
        <div className="text-gray-500">Click to add image</div>
        <button
          onClick={onDelete}
          className="mt-2 p-1 text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    );
  }

  return null;
};

// Presentation View Component
const PresentationView = ({ presentation, onExit }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        setCurrentSlide(prev => Math.min(presentation.slides.length - 1, prev + 1));
      } else if (e.key === 'ArrowLeft') {
        setCurrentSlide(prev => Math.max(0, prev - 1));
      } else if (e.key === 'Escape') {
        onExit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [presentation.slides.length, onExit]);

  const slide = presentation.slides[currentSlide];

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center">
      <button
        onClick={onExit}
        className="absolute top-4 right-4 text-white p-2 hover:bg-white/20 rounded z-10"
      >
        ×
      </button>
      
      <div 
        className="w-full h-full max-w-6xl max-h-[90vh] bg-white rounded-lg p-12 m-8 flex flex-col justify-center"
        style={{ backgroundColor: slide.background }}
      >
        <h1 className="text-6xl font-bold mb-8 text-center">{slide.title}</h1>
        
        {slide.subtitle && (
          <h2 className="text-3xl text-gray-600 mb-12 text-center">{slide.subtitle}</h2>
        )}
        
        <div className="space-y-6 text-2xl">
          {slide.content.map((item) => (
            <div key={item.id}>
              {item.type === 'bullet' && (
                <div className="flex items-start gap-4">
                  <div className="w-3 h-3 bg-gray-600 rounded-full mt-3 flex-shrink-0"></div>
                  <div>{item.text}</div>
                </div>
              )}
              {item.type === 'text' && (
                <div className="whitespace-pre-wrap">{item.text}</div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm">
        {currentSlide + 1} / {presentation.slides.length} • Use arrow keys or space to navigate • ESC to exit
      </div>
    </div>
  );
};
