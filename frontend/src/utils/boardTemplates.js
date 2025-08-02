// Board template generators
export const generateTemplateData = (templateId, options = {}) => {
  const templates = {
    blank: () => ({
      data: [],
      notes: [],
      background: '#ffffff',
      templateType: 'blank'
    }),

    whiteboard: () => ({
      data: [],
      notes: [],
      background: '#ffffff',
      templateType: 'whiteboard'
    }),

    kanban: () => ({
      data: [
        // To Do Column
        {
          id: 'col-1',
          type: 'kanban-column',
          x: 50,
          y: 50,
          width: 280,
          height: 600,
          title: 'To Do',
          cards: [
            { id: 'card-1', title: 'Task 1', description: 'Add your first task here', priority: 'medium' },
            { id: 'card-2', title: 'Task 2', description: 'Add another task', priority: 'low' }
          ],
          color: '#f3f4f6'
        },
        // In Progress Column
        {
          id: 'col-2',
          type: 'kanban-column',
          x: 350,
          y: 50,
          width: 280,
          height: 600,
          title: 'In Progress',
          cards: [
            { id: 'card-3', title: 'Current Task', description: 'Currently working on this', priority: 'high' }
          ],
          color: '#fef3c7'
        },
        // Done Column
        {
          id: 'col-3',
          type: 'kanban-column',
          x: 650,
          y: 50,
          width: 280,
          height: 600,
          title: 'Done',
          cards: [
            { id: 'card-4', title: 'Completed Task', description: 'This task is completed', priority: 'medium' }
          ],
          color: '#d1fae5'
        }
      ],
      notes: [],
      background: '#f9fafb',
      templateType: 'kanban'
    }),

    mindmap: () => ({
      data: [
        // Central node
        {
          id: 'central-node',
          type: 'mindmap-node',
          x: 400,
          y: 300,
          width: 160,
          height: 80,
          text: 'Main Topic',
          level: 0,
          color: '#3b82f6',
          textColor: '#ffffff'
        },
        // Branch nodes
        {
          id: 'branch-1',
          type: 'mindmap-node',
          x: 200,
          y: 200,
          width: 120,
          height: 60,
          text: 'Subtopic 1',
          level: 1,
          color: '#10b981',
          textColor: '#ffffff',
          parentId: 'central-node'
        },
        {
          id: 'branch-2',
          type: 'mindmap-node',
          x: 600,
          y: 200,
          width: 120,
          height: 60,
          text: 'Subtopic 2',
          level: 1,
          color: '#f59e0b',
          textColor: '#ffffff',
          parentId: 'central-node'
        },
        {
          id: 'branch-3',
          type: 'mindmap-node',
          x: 200,
          y: 400,
          width: 120,
          height: 60,
          text: 'Subtopic 3',
          level: 1,
          color: '#ef4444',
          textColor: '#ffffff',
          parentId: 'central-node'
        },
        {
          id: 'branch-4',
          type: 'mindmap-node',
          x: 600,
          y: 400,
          width: 120,
          height: 60,
          text: 'Subtopic 4',  
          level: 1,
          color: '#8b5cf6',
          textColor: '#ffffff',
          parentId: 'central-node'
        },
        // Connections
        {
          id: 'conn-1',
          type: 'mindmap-connection',
          from: 'central-node',
          to: 'branch-1',
          points: [480, 340, 320, 230]
        },
        {
          id: 'conn-2',
          type: 'mindmap-connection',
          from: 'central-node',
          to: 'branch-2',
          points: [480, 340, 660, 230]
        },
        {
          id: 'conn-3',
          type: 'mindmap-connection',
          from: 'central-node',
          to: 'branch-3',
          points: [480, 340, 320, 430]
        },
        {
          id: 'conn-4',
          type: 'mindmap-connection',
          from: 'central-node',
          to: 'branch-4',
          points: [480, 340, 660, 430]
        }
      ],
      notes: [],
      background: '#ffffff',
      templateType: 'mindmap'
    }),

    flowchart: () => ({
      data: [
        // Start node
        {
          id: 'start',
          type: 'flowchart-start',
          x: 400,
          y: 50,
          width: 120,
          height: 60,
          text: 'Start',
          color: '#10b981'
        },
        // Process nodes
        {
          id: 'process-1',
          type: 'flowchart-process',
          x: 375,
          y: 150,
          width: 170,
          height: 60,
          text: 'Process Step 1',
          color: '#3b82f6'
        },
        {
          id: 'decision',
          type: 'flowchart-decision',
          x: 350,
          y: 250,
          width: 220,
          height: 80,
          text: 'Decision Point?',
          color: '#f59e0b'
        },
        {
          id: 'process-2',
          type: 'flowchart-process',
          x: 200,
          y: 380,
          width: 170,
          height: 60,
          text: 'Yes Branch',
          color: '#3b82f6'
        },
        {
          id: 'process-3',
          type: 'flowchart-process',
          x: 550,
          y: 380,
          width: 170,
          height: 60,
          text: 'No Branch',
          color: '#3b82f6'
        },
        // End node
        {
          id: 'end',
          type: 'flowchart-end',
          x: 400,
          y: 500,
          width: 120,
          height: 60,
          text: 'End',
          color: '#ef4444'
        },
        // Arrows
        {
          id: 'arrow-1',
          type: 'flowchart-arrow',
          from: 'start',
          to: 'process-1',
          points: [460, 110, 460, 150]
        },
        {
          id: 'arrow-2', 
          type: 'flowchart-arrow',
          from: 'process-1',
          to: 'decision',
          points: [460, 210, 460, 250]
        },
        {
          id: 'arrow-3',
          type: 'flowchart-arrow',
          from: 'decision',
          to: 'process-2',
          points: [350, 290, 285, 380],
          label: 'Yes'
        },
        {
          id: 'arrow-4',
          type: 'flowchart-arrow',
          from: 'decision',
          to: 'process-3',
          points: [570, 290, 635, 380],
          label: 'No'
        },
        {
          id: 'arrow-5',
          type: 'flowchart-arrow',
          from: 'process-2',
          to: 'end',
          points: [285, 440, 460, 500]
        },
        {
          id: 'arrow-6',
          type: 'flowchart-arrow',
          from: 'process-3',
          to: 'end',
          points: [635, 440, 460, 500]
        }
      ],
      notes: [],
      background: '#ffffff',
      templateType: 'flowchart'
    }),

    presentation: () => ({
      data: [
        // Slide 1
        {
          id: 'slide-1',
          type: 'presentation-slide',
          x: 100,
          y: 100,
          width: 600,
          height: 400,
          slideNumber: 1,
          title: 'Presentation Title',
          subtitle: 'Your subtitle here',
          content: [],
          background: '#ffffff',
          isActive: true
        },
        // Slide 2
        {
          id: 'slide-2',
          type: 'presentation-slide',
          x: 800,
          y: 100,
          width: 600,
          height: 400,
          slideNumber: 2,
          title: 'Slide 2',
          subtitle: 'Add your content',
          content: [
            { type: 'bullet', text: 'Point 1' },
            { type: 'bullet', text: 'Point 2' },
            { type: 'bullet', text: 'Point 3' }
          ],
          background: '#ffffff',
          isActive: false
        }
      ],
      notes: [
        { id: 'note-1', slideId: 'slide-1', text: 'Speaker notes for slide 1' },
        { id: 'note-2', slideId: 'slide-2', text: 'Speaker notes for slide 2' }
      ],
      background: '#f8fafc',
      templateType: 'presentation'
    }),

    brainstorm: () => ({
      data: [
        // Central topic
        {
          id: 'main-topic',
          type: 'brainstorm-topic',
          x: 400,
          y: 300,
          width: 200,
          height: 100,
          text: 'Brainstorming Topic',
          color: '#3b82f6',
          textColor: '#ffffff'
        },
        // Idea bubbles
        {
          id: 'idea-1',
          type: 'brainstorm-idea',
          x: 150,
          y: 150,
          width: 140,
          height: 80,
          text: 'Idea 1',
          color: '#10b981',
          votes: 0
        },
        {
          id: 'idea-2',
          type: 'brainstorm-idea',
          x: 650,
          y: 150,
          width: 140,
          height: 80,
          text: 'Idea 2',
          color: '#f59e0b',
          votes: 0
        },
        {
          id: 'idea-3',
          type: 'brainstorm-idea',
          x: 150,
          y: 450,
          width: 140,
          height: 80,
          text: 'Idea 3',
          color: '#ef4444',
          votes: 0
        },
        {
          id: 'idea-4',
          type: 'brainstorm-idea',
          x: 650,
          y: 450,
          width: 140,
          height: 80,
          text: 'Idea 4',
          color: '#8b5cf6',
          votes: 0
        }
      ],
      notes: [
        { id: 'timer', text: 'Brainstorming Session: 20 minutes', timestamp: Date.now() }
      ],
      background: '#fef7f0',
      templateType: 'brainstorming'
    }),

    meeting: () => ({
      data: [
        // Meeting header
        {
          id: 'meeting-header',
          type: 'meeting-header',
          x: 50,
          y: 50,
          width: 700,
          height: 120,
          title: 'Meeting Title',
          date: new Date().toLocaleDateString(),
          attendees: ['Attendee 1', 'Attendee 2'],
          color: '#f8fafc'
        },
        // Agenda section
        {
          id: 'agenda',
          type: 'meeting-section',
          x: 50,
          y: 200,
          width: 340,
          height: 300,
          title: 'Agenda',
          items: [
            { id: 1, text: 'Introduction', done: false },
            { id: 2, text: 'Project Updates', done: false },
            { id: 3, text: 'Discussion Points', done: false },
            { id: 4, text: 'Action Items', done: false },
            { id: 5, text: 'Next Steps', done: false }
          ],
          color: '#e0f2fe'
        },
        // Notes section  
        {
          id: 'notes-section',
          type: 'meeting-section',
          x: 410,
          y: 200,
          width: 340,
          height: 300,
          title: 'Notes',
          items: [
            { id: 1, text: 'Key discussion points...', done: false },
            { id: 2, text: 'Important decisions...', done: false }
          ],
          color: '#f0fdf4'
        },
        // Action items
        {
          id: 'action-items',
          type: 'meeting-section',
          x: 50,
          y: 520,
          width: 700,
          height: 200,
          title: 'Action Items',
          items: [
            { id: 1, text: 'Task 1 - Assigned to: [Name]', deadline: '2025-08-01', done: false },
            { id: 2, text: 'Task 2 - Assigned to: [Name]', deadline: '2025-08-03', done: false }
          ],
          color: '#fef3c7'
        }
      ],
      notes: [],
      background: '#ffffff',
      templateType: 'meeting'
    })
  };

  const generator = templates[templateId];
  if (!generator) {
    console.warn(`Template "${templateId}" not found, falling back to blank template`);
    return templates.blank();
  }

  const templateData = generator();
  
  // Apply any custom options
  if (options.title) {
    templateData.title = options.title;
  }
  if (options.background) {
    templateData.background = options.background;
  }

  return templateData;
};

// Get template-specific toolbar tools
export const getTemplateTools = (templateType) => {
  const commonTools = ['select', 'pen', 'eraser', 'text', 'shapes'];
  
  const templateSpecificTools = {
    kanban: [...commonTools, 'kanban-card', 'kanban-column'],
    mindmap: [...commonTools, 'mindmap-node', 'mindmap-connection'],
    flowchart: [...commonTools, 'flowchart-start', 'flowchart-process', 'flowchart-decision', 'flowchart-end', 'flowchart-arrow'],
    presentation: [...commonTools, 'slide', 'bullet-list', 'image'],
    brainstorm: [...commonTools, 'brainstorm-idea', 'voting'],
    meeting: [...commonTools, 'checkbox', 'timer', 'attendee'],
    blank: commonTools,
    whiteboard: commonTools
  };

  return templateSpecificTools[templateType] || commonTools;
};

// Template-specific colors
export const getTemplateColors = (templateType) => {
  const templateColors = {
    kanban: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
    mindmap: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'],
    flowchart: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'],
    presentation: ['#1e293b', '#3b82f6', '#10b981', '#f59e0b'],
    brainstorm: ['#fbbf24', '#34d399', '#f87171', '#a78bfa', '#fb7185'],
    meeting: ['#64748b', '#3b82f6', '#10b981', '#f59e0b']
  };

  return templateColors[templateType] || ['#000000', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
};
