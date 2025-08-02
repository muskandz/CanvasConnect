import React, { useState, useRef, useEffect } from 'react';
import { 
  Filter, ChevronDown, Grid, List, Clock, 
  Calendar, Users, SortAsc, Star,
  TrendingUp, Eye
} from 'lucide-react';

export default function FilterDropdown({ 
  sortBy, 
  setSortBy, 
  viewMode, 
  setViewMode 
}) {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const sortOptions = [
    { key: 'lastModified', label: 'Last Modified', icon: Clock },
    { key: 'created', label: 'Date Created', icon: Calendar },
    { key: 'alphabetical', label: 'Alphabetical', icon: SortAsc },
    { key: 'collaborators', label: 'Most Collaborative', icon: Users },
    { key: 'favorites', label: 'Favorites First', icon: Star },
    { key: 'views', label: 'Most Viewed', icon: Eye }
  ];

  const viewOptions = [
    { key: 'grid', label: 'Grid View', icon: Grid },
    { key: 'list', label: 'List View', icon: List }
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentSort = sortOptions.find(option => option.key === sortBy);

  return (
    <div className="flex items-center space-x-2">
      {/* View Mode Toggle */}
      <div className="flex bg-gray-100 rounded-lg p-1">
        {viewOptions.map(option => (
          <button
            key={option.key}
            onClick={() => setViewMode(option.key)}
            className={`p-2 rounded-md transition-all ${
              viewMode === option.key
                ? 'bg-white text-purple-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            title={option.label}
          >
            <option.icon className="w-4 h-4" />
          </button>
        ))}
      </div>

      {/* Sort Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">
            {currentSort?.label || 'Sort by'}
          </span>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${
            showDropdown ? 'rotate-180' : ''
          }`} />
        </button>

        {showDropdown && (
          <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-lg z-50">
            <div className="py-2">
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                Sort Options
              </div>
              {sortOptions.map(option => (
                <button
                  key={option.key}
                  onClick={() => {
                    setSortBy(option.key);
                    setShowDropdown(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${
                    sortBy === option.key ? 'text-purple-600 bg-purple-50' : 'text-gray-700'
                  }`}
                >
                  <option.icon className="w-4 h-4" />
                  <span>{option.label}</span>
                  {sortBy === option.key && (
                    <div className="ml-auto w-2 h-2 bg-purple-600 rounded-full"></div>
                  )}
                </button>
              ))}
              
              <div className="border-t border-gray-100 mt-2 pt-2">
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  View Options
                </div>
                {viewOptions.map(option => (
                  <button
                    key={option.key}
                    onClick={() => {
                      setViewMode(option.key);
                      setShowDropdown(false);
                    }}
                    className={`w-full flex items-center space-x-3 px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${
                      viewMode === option.key ? 'text-purple-600 bg-purple-50' : 'text-gray-700'
                    }`}
                  >
                    <option.icon className="w-4 h-4" />
                    <span>{option.label}</span>
                    {viewMode === option.key && (
                      <div className="ml-auto w-2 h-2 bg-purple-600 rounded-full"></div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}