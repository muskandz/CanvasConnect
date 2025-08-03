// API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000',
  SOCKET_URL: import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000',
};

// Create axios instance with base configuration
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: 10000,
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
