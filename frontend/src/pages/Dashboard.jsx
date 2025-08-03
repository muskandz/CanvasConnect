import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebaseConfig";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { apiClient, API_ENDPOINTS } from "../config/api";
import ShareModal from "../components/ShareModal";
import CreateModal from "../components/CreateModal";
import FilterDropdown from "../components/FilterDropdown";
import EmptyState from "../components/EmptyState";
import BoardCard from "../components/BoardCard";
import ThemeToggle from "../components/ThemeToggle";
import { generateTemplateData } from "../utils/boardTemplates";
import { 
  Plus, Search, Grid, List, Share2, Trash2, User, LogOut, MoreHorizontal, 
  Users, Clock, Star, Filter, Eye, Edit3, MessageCircle, Zap, 
  Calendar, FolderOpen, Heart, UserCheck, Settings, Bell, Download,
  Copy, Archive, Move, Tag, BookOpen
} from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const [boards, setBoards] = useState([]);
  const [user, setUser] = useState(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedBoardId, setSelectedBoardId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [activeFilter, setActiveFilter] = useState("recent");
  const [sortBy, setSortBy] = useState("lastModified");
  const [recentActivity, setRecentActivity] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loading, setLoading] = useState(true);

  const filterOptions = [
    { key: "recent", label: "Recent", icon: Clock },
    { key: "favorites", label: "Favorites", icon: Star },
    { key: "owned", label: "Created by me", icon: User },
    { key: "shared", label: "Shared with me", icon: Users },
    { key: "archived", label: "Archived", icon: Archive }
  ];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await fetchUserData(currentUser.uid);
      } else {
        navigate("/login");
      }
    });
    
    return () => unsubscribe();
  }, [navigate]);

  const fetchUserData = async (userId) => {
    setLoading(true);
    try {
      // Fetch real data from backend
      const [boardsRes, activityRes] = await Promise.all([
        apiClient.get(API_ENDPOINTS.BOARDS_BY_USER(userId)).catch(() => ({ data: [] })),
        apiClient.get(API_ENDPOINTS.USER_ACTIVITY(userId)).catch(() => ({ data: [] }))
      ]);
      
      // Add enhanced properties to real boards
      const enhancedBoards = boardsRes.data.map(board => ({
        ...board,
        isFavorite: false, // You can add favorites functionality later
        isArchived: false,
        collaborators: [], // Add collaborators functionality later
        commentCount: 0,
        viewCount: Math.floor(Math.random() * 50) + 1,
        description: board.description || `A collaborative ${board.type || 'whiteboard'} for team projects`,
        permissions: {
          canEdit: true,
          canComment: true,
          canShare: true
        }
      }));
      
      setBoards(enhancedBoards);
      setRecentActivity(activityRes.data || []);
    } catch (err) {
      console.error("Error fetching user data:", err);
      // Set empty arrays if there's an error
      setBoards([]);
      setRecentActivity([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedBoards = useMemo(() => {
    let filtered = boards.filter(board => {
      const matchesSearch = board.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           board.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      switch (activeFilter) {
        case "recent":
          return matchesSearch && !board.isArchived;
        case "favorites":
          return matchesSearch && board.isFavorite && !board.isArchived;
        case "owned":
          return matchesSearch && board.ownerId === user?.uid && !board.isArchived;
        case "shared":
          return matchesSearch && board.ownerId !== user?.uid && !board.isArchived;
        case "archived":
          return matchesSearch && board.isArchived;
        default:
          return matchesSearch && !board.isArchived;
      }
    });

    // Sort boards
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "lastModified":
          return new Date(b.updatedAt) - new Date(a.updatedAt);
        case "created":
          return new Date(b.createdAt) - new Date(a.createdAt);
        case "alphabetical":
          return a.title.localeCompare(b.title);
        case "collaborators":
          return (b.collaborators?.length || 0) - (a.collaborators?.length || 0);
        case "favorites":
          return b.isFavorite - a.isFavorite;
        case "views":
          return (b.viewCount || 0) - (a.viewCount || 0);
        default:
          return new Date(b.updatedAt) - new Date(a.updatedAt);
      }
    });

    return filtered;
  }, [boards, searchTerm, activeFilter, sortBy, user?.uid]);

  const handleNewBoard = async (boardType = "whiteboard", options = {}) => {
    if (!user) return;

    try {
      // Generate template-specific data
      const templateData = generateTemplateData(boardType, options);
      
      // Create board via backend API
      const response = await apiClient.post(API_ENDPOINTS.BOARDS, {
        userId: user.uid,
        title: options.title || `Untitled ${boardType}`,
        description: options.description || `A collaborative ${boardType} for team projects`,
        type: boardType,
        isPublic: false,
        data: JSON.stringify(templateData.data), // Store template data as JSON
        background: templateData.background,
        templateType: templateData.templateType
      });

      const newBoard = {
        ...response.data,
        isFavorite: false,
        isArchived: false,
        collaborators: [],
        commentCount: 0,
        viewCount: 1,
        permissions: {
          canEdit: true,
          canComment: true,
          canShare: true
        }
      };

      setBoards(prev => [newBoard, ...prev]);
      
      // Navigate to the board editor
      navigate(`/board/${response.data.id}`);
    } catch (err) {
      console.error("Error creating board:", err);
      alert("Failed to create board. Please make sure the backend server is running.");
    }
  };

  const handleBoardAction = async (boardId, action, data = {}) => {
    try {
      switch (action) {
        case "favorite":
          // For now, just update locally
          setBoards(prev => prev.map(b => 
            b.id === boardId ? { ...b, isFavorite: !b.isFavorite } : b
          ));
          break;
        
        case "archive":
          setBoards(prev => prev.map(b => 
            b.id === boardId ? { ...b, isArchived: !b.isArchived } : b
          ));
          break;
        
        case "duplicate":
          const originalBoard = boards.find(b => b.id === boardId);
          if (originalBoard) {
            const duplicatedBoard = {
              ...originalBoard,
              id: Date.now().toString(),
              title: `${originalBoard.title} (Copy)`,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
            setBoards(prev => [duplicatedBoard, ...prev]);
          }
          break;
        
        case "delete":
          if (confirm("Are you sure you want to delete this board? This action cannot be undone.")) {
            try {
              // Delete from backend
              await apiClient.delete(API_ENDPOINTS.DELETE_BOARD(boardId));
              // Remove from local state
              setBoards(prev => prev.filter(b => b.id !== boardId));
            } catch (err) {
              console.error("Error deleting board:", err);
              alert("Failed to delete board. Please make sure the backend server is running.");
            }
          }
          break;
        
        case "export":
          console.log("Export functionality not implemented yet");
          break;
        
        case "move":
          console.log("Move functionality not implemented yet");
          break;
      }
    } catch (err) {
      console.error(`Error performing ${action}:`, err);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const handleLogout = () => {
    signOut(auth).then(() => navigate("/login"));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              {/* Logo */}
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg">CC</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">CanvasConnect</h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Collaborative Workspace</p>
                </div>
              </div>

              {/* Navigation */}
              <nav className="hidden md:flex items-center space-x-1">
                {filterOptions.map((option) => (
                  <button
                    key={option.key}
                    onClick={() => setActiveFilter(option.key)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                      activeFilter === option.key
                        ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 shadow-sm"
                        : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    <option.icon className="w-4 h-4" />
                    <span>{option.label}</span>
                  </button>
                ))}
              </nav>
            </div>

            {/* User Actions */}
            <div className="flex items-center space-x-4">
              {/* Theme Toggle */}
              <ThemeToggle />
              
              {/* User Menu */}
              <div className="flex items-center space-x-3">
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.displayName || "User"}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
                </div>
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {(user?.displayName || user?.email || "U").charAt(0).toUpperCase()}
                  </span>
                </div>
                <button
                  onClick={() => navigate('/settings')}
                  className="flex items-center space-x-2 px-3 py-2 text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  <span className="hidden sm:inline">Settings</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 px-3 py-2 text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Sign out</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 py-8 max-w-7xl mx-auto">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {getGreeting()}, {user?.displayName?.split(' ')[0] || 'there'}! 👋
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                {activeFilter === "recent" && "Here are your recent boards"}
                {activeFilter === "favorites" && "Your favorite boards"}
                {activeFilter === "owned" && "Boards you created"}
                {activeFilter === "shared" && "Boards shared with you"}
                {activeFilter === "archived" && "Your archived boards"}
              </p>
            </div>
            
            <button
              onClick={() => setCreateOpen(true)}
              className="group bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-xl font-medium flex items-center space-x-3 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <div className="bg-white bg-opacity-20 p-2 rounded-lg group-hover:bg-opacity-30 transition-all">
                <Plus className="w-5 h-5" />
              </div>
              <span>Create New</span>
            </button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{boards.filter(b => !b.isArchived).length}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Active Boards</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {boards.reduce((acc, b) => acc + (b.collaborators?.length || 0), 0)}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Collaborators</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                  <Star className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{boards.filter(b => b.isFavorite).length}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Favorites</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <Zap className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {recentActivity.filter(a => 
                      new Date(a.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                    ).length}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">This Week</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
            <input
              type="text"
              placeholder="Search boards..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            />
          </div>
          
          <div className="flex items-center space-x-3">
            <FilterDropdown 
              sortBy={sortBy} 
              setSortBy={setSortBy}
              viewMode={viewMode}
              setViewMode={setViewMode}
            />
          </div>
        </div>

        {/* Boards Grid */}
        {filteredAndSortedBoards.length === 0 ? (
          <EmptyState activeFilter={activeFilter} onCreateNew={() => setCreateOpen(true)} />
        ) : (
          <div className={`grid gap-6 ${
            viewMode === "grid" 
              ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
              : "grid-cols-1"
          }`}>
            {filteredAndSortedBoards.map((board) => (
              <BoardCard
                key={board.id}
                board={board}
                viewMode={viewMode}
                currentUserId={user?.uid}
                onAction={handleBoardAction}
                onShare={(boardId) => {
                  setSelectedBoardId(boardId);
                  setShareOpen(true);
                }}
                onEdit={(boardId) => navigate(`/board/${boardId}`)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Modals */}
      <ShareModal 
        isOpen={shareOpen} 
        setIsOpen={setShareOpen} 
        boardId={selectedBoardId}
      />
      
      <CreateModal
        isOpen={createOpen}
        setIsOpen={setCreateOpen}
        onCreateBoard={handleNewBoard}
      />
    </div>
  );
}