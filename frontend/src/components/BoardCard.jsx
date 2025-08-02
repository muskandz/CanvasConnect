import React, { useState } from 'react';
import { 
  MoreHorizontal, Star, Users, Clock, Eye, Edit3, 
  Share2, Copy, Archive, Trash2, Move, Download,
  MessageCircle, Heart, UserCheck, Lock, Globe
} from 'lucide-react';

export default function BoardCard({ 
  board, 
  viewMode, 
  currentUserId, 
  onAction, 
  onShare, 
  onEdit 
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const isOwner = board.ownerId === currentUserId;
  const canEdit = isOwner || board.permissions?.canEdit;
  
  const getPermissionIcon = () => {
    if (board.isPublic) return <Globe className="w-3 h-3 text-green-500" />;
    if (board.collaborators?.length > 0) return <Users className="w-3 h-3 text-blue-500" />;
    return <Lock className="w-3 h-3 text-gray-400" />;
  };

  const getCollaboratorAvatars = () => {
    const maxShow = 3;
    const collaborators = board.collaborators || [];
    
    return (
      <div className="flex -space-x-2">
        {collaborators.slice(0, maxShow).map((collaborator, idx) => (
          <div
            key={idx}
            className="w-6 h-6 rounded-full border-2 border-white bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-xs font-medium text-white"
            title={collaborator.email}
          >
            {collaborator.name?.charAt(0) || collaborator.email.charAt(0)}
          </div>
        ))}
        {collaborators.length > maxShow && (
          <div className="w-6 h-6 rounded-full border-2 border-white bg-gray-300 flex items-center justify-center text-xs font-medium text-gray-600">
            +{collaborators.length - maxShow}
          </div>
        )}
      </div>
    );
  };

  if (viewMode === "list") {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:shadow-md transition-all group">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 rounded-lg flex items-center justify-center">
              <span className="text-purple-600 dark:text-purple-400 font-semibold text-sm">
                {board.title.charAt(0).toUpperCase()}
              </span>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="font-semibold text-gray-900 dark:text-white truncate">{board.title}</h3>
                {board.isFavorite && <Star className="w-4 h-4 text-yellow-500 fill-current" />}
                {getPermissionIcon()}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {isOwner ? "Created" : "Shared"} {getTimeAgo(board.updatedAt)}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {board.collaborators?.length > 0 && getCollaboratorAvatars()}
            
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <MessageCircle className="w-4 h-4" />
              <span>{board.commentCount || 0}</span>
            </div>
            
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
              
              {showMenu && (
                <BoardMenu
                  board={board}
                  isOwner={isOwner}
                  canEdit={canEdit}
                  onAction={onAction}
                  onShare={onShare}
                  onEdit={onEdit}
                  onClose={() => setShowMenu(false)}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200 hover:-translate-y-1 relative">
      {/* Thumbnail */}
      <div className="aspect-video bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 relative overflow-hidden">
        {board.thumbnail ? (
          <img
            src={board.thumbnail}
            alt={board.title}
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setImageLoaded(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-6xl font-bold text-purple-200">
              {board.title.charAt(0).toUpperCase()}
            </div>
          </div>
        )}
        
        {/* Overlay actions */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="flex space-x-2">
            <button
              onClick={() => onEdit(board.id)}
              className="p-2 bg-white rounded-lg shadow-lg hover:bg-gray-50 transition-colors"
              title={canEdit ? "Edit" : "View"}
            >
              {canEdit ? <Edit3 className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
            <button
              onClick={() => onShare(board.id)}
              className="p-2 bg-white rounded-lg shadow-lg hover:bg-gray-50 transition-colors"
              title="Share"
            >
              <Share2 className="w-4 h-4" />
            </button>
            {isOwner && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm('Are you sure you want to delete this board? This action cannot be undone.')) {
                    onAction(board.id, 'delete');
                  }
                }}
                className="p-2 bg-red-500 text-white rounded-lg shadow-lg hover:bg-red-600 transition-colors"
                title="Delete Board"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Status badges */}
        <div className="absolute top-3 left-3 flex space-x-2">
          {board.isFavorite && (
            <div className="bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1">
              <Star className="w-3 h-3 fill-current" />
            </div>
          )}
          {!isOwner && (
            <div className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-medium">
              Shared
            </div>
          )}
        </div>

        {/* Permission indicator and Delete button */}
        <div className="absolute top-3 right-3 flex items-center space-x-2">
          {getPermissionIcon()}
          {isOwner && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm('Are you sure you want to delete this board? This action cannot be undone.')) {
                  onAction(board.id, 'delete');
                }
              }}
              className="opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-lg shadow-lg"
              title="Delete Board"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2 flex-1">{board.title}</h3>
          <div className="relative ml-2">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
            
            {showMenu && (
              <BoardMenu
                board={board}
                isOwner={isOwner}
                canEdit={canEdit}
                onAction={onAction}
                onShare={onShare}
                onEdit={onEdit}
                onClose={() => setShowMenu(false)}
              />
            )}
          </div>
        </div>

        {board.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">{board.description}</p>
        )}

        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4" />
            <span>{getTimeAgo(board.updatedAt)}</span>
          </div>
          
          <div className="flex items-center space-x-3">
            {board.commentCount > 0 && (
              <div className="flex items-center space-x-1">
                <MessageCircle className="w-4 h-4" />
                <span>{board.commentCount}</span>
              </div>
            )}
            
            {board.collaborators?.length > 0 && getCollaboratorAvatars()}
          </div>
        </div>
      </div>
    </div>
  );
}

function BoardMenu({ board, isOwner, canEdit, onAction, onShare, onEdit, onClose }) {
  const menuItems = [
    { 
      icon: canEdit ? Edit3 : Eye, 
      label: canEdit ? "Edit" : "View", 
      action: () => onEdit(board.id) 
    },
    { 
      icon: Share2, 
      label: "Share", 
      action: () => onShare(board.id) 
    },
    { 
      icon: Copy, 
      label: "Duplicate", 
      action: () => onAction(board.id, "duplicate") 
    },
    { 
      icon: Star, 
      label: board.isFavorite ? "Remove from favorites" : "Add to favorites", 
      action: () => onAction(board.id, "favorite") 
    },
    { 
      icon: Download, 
      label: "Export", 
      action: () => onAction(board.id, "export") 
    },
    { 
      icon: Move, 
      label: "Move to folder", 
      action: () => onAction(board.id, "move") 
    },
    { 
      icon: Archive, 
      label: board.isArchived ? "Unarchive" : "Archive", 
      action: () => onAction(board.id, "archive") 
    }
  ];

  // Add delete option at the top for owners
  if (isOwner) {
    menuItems.unshift({
      icon: Trash2,
      label: "Delete Board",
      action: () => onAction(board.id, "delete"),
      danger: true
    });
  }

  return (
    <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-xl z-[100] max-h-64 overflow-y-auto">
      <div className="py-1">
        {menuItems.map((item, idx) => (
          <button
            key={idx}
            onClick={() => {
              item.action();
              onClose();
            }}
            className={`w-full flex items-center space-x-3 px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
              item.danger ? 'text-red-600 hover:bg-red-50 border-b border-gray-200' : 'text-gray-700'
            }`}
          >
            <item.icon className="w-4 h-4" />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function getTimeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
  return `${Math.ceil(diffDays / 30)} months ago`;
}