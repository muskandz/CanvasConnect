import React from 'react';
import { 
  Plus, FileText, Users, Star, Archive, 
  Search, Lightbulb, Zap 
} from 'lucide-react';

export default function EmptyState({ activeFilter, onCreateNew }) {
  const getEmptyStateContent = () => {
    switch (activeFilter) {
      case 'favorites':
        return {
          icon: Star,
          title: 'No favorites yet',
          description: 'Star boards you use frequently to find them here quickly.',
          action: 'Browse boards',
          color: 'text-yellow-500'
        };
      case 'shared':
        return {
          icon: Users,
          title: 'No shared boards',
          description: 'Boards that others share with you will appear here.',
          action: 'Create board to share',
          color: 'text-blue-500'
        };
      case 'archived':
        return {
          icon: Archive,
          title: 'No archived boards',
          description: 'Boards you archive will be stored here safely.',
          action: 'Go to recent boards',
          color: 'text-gray-500'
        };
      case 'owned':
        return {
          icon: FileText,
          title: 'No boards created yet',
          description: 'Create your first board to start collaborating.',
          action: 'Create your first board',
          color: 'text-purple-500'
        };
      default:
        return {
          icon: Lightbulb,
          title: 'Welcome to CanvasConnect!',
          description: 'Create your first board and start bringing ideas to life.',
          action: 'Create your first board',
          color: 'text-purple-500'
        };
    }
  };

  const content = getEmptyStateContent();
  const IconComponent = content.icon;

  return (
    <div className="text-center py-16">
      <div className={`inline-flex p-4 rounded-full bg-gray-100 mb-6`}>
        <IconComponent className={`w-12 h-12 ${content.color}`} />
      </div>
      
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        {content.title}
      </h3>
      
      <p className="text-gray-600 mb-8 max-w-md mx-auto">
        {content.description}
      </p>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button
          onClick={onCreateNew}
          className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 shadow-lg"
        >
          <Plus className="w-4 h-4" />
          <span>{content.action}</span>
        </button>
        
        {activeFilter !== 'recent' && (
          <button className="inline-flex items-center space-x-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-6 py-3 rounded-xl font-medium transition-colors">
            <Search className="w-4 h-4" />
            <span>Browse all boards</span>
          </button>
        )}
      </div>

      {/* Quick Tips */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        <div className="text-center p-4">
          <div className="inline-flex p-3 bg-blue-100 rounded-full mb-3">
            <Plus className="w-6 h-6 text-blue-600" />
          </div>
          <h4 className="font-medium text-gray-900 mb-1">Create & Collaborate</h4>
          <p className="text-sm text-gray-600">Start with templates or blank canvas</p>
        </div>
        
        <div className="text-center p-4">
          <div className="inline-flex p-3 bg-green-100 rounded-full mb-3">
            <Users className="w-6 h-6 text-green-600" />
          </div>
          <h4 className="font-medium text-gray-900 mb-1">Share & Invite</h4>
          <p className="text-sm text-gray-600">Collaborate with your team in real-time</p>
        </div>
        
        <div className="text-center p-4">
          <div className="inline-flex p-3 bg-purple-100 rounded-full mb-3">
            <Zap className="w-6 h-6 text-purple-600" />
          </div>
          <h4 className="font-medium text-gray-900 mb-1">Stay Organized</h4>
          <p className="text-sm text-gray-600">Use favorites, folders, and filters</p>
        </div>
      </div>
    </div>
  );
}
