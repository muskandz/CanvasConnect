import React, { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import axios from 'axios';
import WhiteboardEditor from '../pages/WhiteboardEditor';
import KanbanEditor from '../pages/KanbanEditor';
import PresentationEditor from '../pages/PresentationEditor';
import MindMapEditor from '../pages/MindMapEditor';
import FlowchartEditor from '../pages/FlowchartEditor';
import BrainstormingEditor from '../pages/BrainstormingEditor';
import MeetingEditor from '../pages/MeetingEditor';

export default function TemplateRouter() {
  const { id } = useParams();
  const [templateType, setTemplateType] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBoardData = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/boards/${id}`);
        const board = response.data;
        
        // Determine template type from board data
        let type = board.templateType || 'whiteboard';
        
        // If no templateType is set, try to infer from title or default to whiteboard
        if (!board.templateType) {
          const title = board.title?.toLowerCase() || '';
          if (title.includes('kanban')) type = 'kanban';
          else if (title.includes('presentation')) type = 'presentation';
          else if (title.includes('mindmap') || title.includes('mind map')) type = 'mindmap';
          else if (title.includes('flowchart')) type = 'flowchart';
          else if (title.includes('brainstorm')) type = 'brainstorming';
          else if (title.includes('meeting')) type = 'meeting';
          else type = 'whiteboard';
        }
        
        setTemplateType(type);
      } catch (err) {
        console.error('Failed to fetch board data:', err);
        setError('Failed to load board');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchBoardData();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading board...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  // Route to the appropriate editor component based on template type
  switch (templateType) {
    case 'kanban':
      return <KanbanEditor />;
    case 'presentation':
      return <PresentationEditor />;
    case 'mindmap':
      return <MindMapEditor />;
    case 'flowchart':
      return <FlowchartEditor />;
    case 'brainstorm':
    case 'brainstorming':
      return <BrainstormingEditor />;
    case 'meeting':
      return <MeetingEditor />;
    case 'whiteboard':
    default:
      return <WhiteboardEditor />;
  }
}
