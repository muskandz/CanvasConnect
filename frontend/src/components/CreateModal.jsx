import React, { useState } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { 
  X, Plus, FileText, Map, GitBranch, Users, 
  Presentation, Calculator, Calendar, Zap,
  Grid, Layers, Target, Lightbulb
} from 'lucide-react';

export default function CreateModal({ isOpen, setIsOpen, onCreateBoard }) {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [boardTitle, setBoardTitle] = useState('');
  const [boardDescription, setBoardDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const templates = [
    {
      id: 'blank',
      name: 'Blank Canvas',
      description: 'Start with a clean slate',
      icon: FileText,
      color: 'from-gray-500 to-gray-600',
      category: 'Basic'
    },
    {
      id: 'whiteboard',
      name: 'Whiteboard',
      description: 'Free-form collaborative space',
      icon: Grid,
      color: 'from-blue-500 to-blue-600',
      category: 'Basic'
    },
    {
      id: 'mindmap',
      name: 'Mind Map',
      description: 'Organize ideas and concepts',
      icon: GitBranch,
      color: 'from-green-500 to-green-600',
      category: 'Planning'
    },
    {
      id: 'flowchart',
      name: 'Flowchart',
      description: 'Process flows and diagrams',
      icon: Layers,
      color: 'from-purple-500 to-purple-600',
      category: 'Planning'
    },
    {
      id: 'kanban',
      name: 'Kanban Board',
      description: 'Task management and workflow',
      icon: Target,
      color: 'from-orange-500 to-orange-600',
      category: 'Project Management'
    },
    {
      id: 'presentation',
      name: 'Presentation',
      description: 'Slides and presentations',
      icon: Presentation,
      color: 'from-red-500 to-red-600',
      category: 'Presentation'
    },
    {
      id: 'brainstorm',
      name: 'Brainstorming',
      description: 'Idea generation session',
      icon: Lightbulb,
      color: 'from-yellow-500 to-yellow-600',
      category: 'Collaboration'
    },
    {
      id: 'meeting',
      name: 'Meeting Notes',
      description: 'Structured meeting template',
      icon: Users,
      color: 'from-indigo-500 to-indigo-600',
      category: 'Meeting'
    }
  ];

  const categories = [...new Set(templates.map(t => t.category))];

  const handleCreate = async () => {
    if (!selectedTemplate) return;
    
    setIsCreating(true);
    try {
      const title = boardTitle.trim() || `New ${templates.find(t => t.id === selectedTemplate)?.name}`;
      await onCreateBoard(selectedTemplate, {
        title,
        description: boardDescription.trim(),
        template: selectedTemplate
      });
      
      // Reset form
      setSelectedTemplate(null);
      setBoardTitle('');
      setBoardDescription('');
      setIsOpen(false);
    } catch (error) {
      console.error('Error creating board:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const selectedTemplateData = templates.find(t => t.id === selectedTemplate);

  return (
    <Dialog 
      open={isOpen} 
      onClose={() => !isCreating && setIsOpen(false)}
      className="fixed inset-0 z-50 overflow-y-auto"
    >
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-30 transition-opacity" />
        
        <DialogPanel className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <DialogTitle className="text-2xl font-bold text-gray-900">
                Create New Board
              </DialogTitle>
              <p className="text-gray-600 mt-1">Choose a template to get started</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              disabled={isCreating}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex h-[600px]">
            {/* Template Selection */}
            <div className="flex-1 p-6 overflow-y-auto">
              {categories.map(category => (
                <div key={category} className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">{category}</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {templates.filter(t => t.category === category).map(template => (
                      <button
                        key={template.id}
                        onClick={() => setSelectedTemplate(template.id)}
                        className={`p-4 rounded-xl border-2 transition-all text-left hover:shadow-md ${
                          selectedTemplate === template.id
                            ? 'border-purple-500 bg-purple-50 shadow-md'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center space-x-3 mb-2">
                          <div className={`p-2 rounded-lg bg-gradient-to-r ${template.color} shadow-sm`}>
                            <template.icon className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{template.name}</h4>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600">{template.description}</p>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Configuration Panel */}
            <div className="w-80 border-l border-gray-200 p-6 bg-gray-50">
              {selectedTemplate ? (
                <div className="space-y-6">
                  {/* Selected Template Info */}
                  <div className="text-center">
                    <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-r ${selectedTemplateData.color} shadow-lg mb-4`}>
                      <selectedTemplateData.icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {selectedTemplateData.name}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {selectedTemplateData.description}
                    </p>
                  </div>

                  {/* Form Fields */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Board Name
                      </label>
                      <input
                        type="text"
                        value={boardTitle}
                        onChange={(e) => setBoardTitle(e.target.value)}
                        placeholder={`New ${selectedTemplateData.name}`}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description (Optional)
                      </label>
                      <textarea
                        value={boardDescription}
                        onChange={(e) => setBoardDescription(e.target.value)}
                        placeholder="Add a description for your board..."
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
                      />
                    </div>

                    {/* Privacy Settings */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Privacy
                      </label>
                      <div className="space-y-2">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="privacy"
                            defaultChecked
                            className="text-purple-600 focus:ring-purple-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">Private - Only you can access</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="privacy"
                            className="text-purple-600 focus:ring-purple-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">Team - Share with collaborators</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Create Button */}
                  <button
                    onClick={handleCreate}
                    disabled={isCreating}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 text-white py-3 px-4 rounded-xl font-medium transition-all duration-200 flex items-center justify-center space-x-2"
                  >
                    {isCreating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Creating...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        <span>Create Board</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="text-center text-gray-500 mt-20">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Plus className="w-8 h-8 text-gray-400" />
                  </div>
                  <p>Select a template to continue</p>
                </div>
              )}
            </div>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}