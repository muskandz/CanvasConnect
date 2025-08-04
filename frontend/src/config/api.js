// API Configuration
const getApiUrl = () => {
  // Always use production URL if we're on the vercel domain
  if (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')) {
    return 'https://canvasconnect-fcch.onrender.com';
  }
  
  // If we're in production and no env var is set, use the deployed backend
  if (import.meta.env.PROD && !import.meta.env.VITE_API_BASE_URL) {
    return 'https://canvasconnect-fcch.onrender.com';
  }
  
  return import.meta.env.VITE_API_BASE_URL || 'https://canvasconnect-fcch.onrender.com';
};

const getSocketUrl = () => {
  // Always use production URL if we're on the vercel domain
  if (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')) {
    return 'https://canvasconnect-fcch.onrender.com';
  }
  
  // If we're in production and no env var is set, use the deployed backend
  if (import.meta.env.PROD && !import.meta.env.VITE_SOCKET_URL) {
    return 'https://canvasconnect-fcch.onrender.com';
  }
  
  return import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
};

export const API_CONFIG = {
  BASE_URL: getApiUrl(),
  SOCKET_URL: getSocketUrl(),
};

// Always log API config for debugging
console.log('🔧 API Configuration:', {
  BASE_URL: API_CONFIG.BASE_URL,
  SOCKET_URL: API_CONFIG.SOCKET_URL,
  MODE: import.meta.env.MODE,
  DEV: import.meta.env.DEV,
  PROD: import.meta.env.PROD,
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
  VITE_SOCKET_URL: import.meta.env.VITE_SOCKET_URL,
  HOSTNAME: typeof window !== 'undefined' ? window.location.hostname : 'server',
  IS_VERCEL: typeof window !== 'undefined' ? window.location.hostname.includes('vercel.app') : false
});

// Runtime check - if we detect localhost in production, force the correct URL
if (typeof window !== 'undefined' && 
    window.location.hostname.includes('vercel.app') && 
    API_CONFIG.BASE_URL.includes('localhost')) {
  console.warn('⚠️ Detected localhost URL in production! Forcing production URL...');
  API_CONFIG.BASE_URL = 'https://canvasconnect-fcch.onrender.com';
  API_CONFIG.SOCKET_URL = 'https://canvasconnect-fcch.onrender.com';
}

// Create axios instance with base configuration
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: 30000, // Increased to 30 seconds for backend database operations
  headers: {
    'Content-Type': 'application/json',
  },
});

// API endpoints
export const API_ENDPOINTS = {
  HEALTH: '/api/health',
  BOARDS: '/api/boards',
  BOARDS_BY_USER: (userId) => `/api/boards/user/${userId}`,
  BOARD_BY_ID: (boardId) => `/api/boards/${boardId}`,
  UPDATE_BOARD: '/api/boards/update',
  DELETE_BOARD: (boardId) => `/api/boards/${boardId}`,
  USER_ACTIVITY: (userId) => `/api/activity/user/${userId}`,
};
