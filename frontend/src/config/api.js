import axios from 'axios';

// Environment flags
const IS_BROWSER = typeof window !== 'undefined';
const IS_PROD = import.meta.env.PROD;
const IS_DEV = import.meta.env.DEV;

// Host-based deploy detection
const IS_VERCEL = IS_BROWSER && window.location.hostname.includes('vercel.app');

const ENV_API_BASE = import.meta.env.VITE_API_BASE_URL;
const ENV_SOCKET_URL = import.meta.env.VITE_SOCKET_URL;

const FALLBACK_BACKEND_URL = 'https://canvasconnect-fcch.onrender.com';

// URL resolution logic
const resolveApiUrl = () => {
  if (IS_VERCEL || (IS_PROD && !ENV_API_BASE)) {
    return FALLBACK_BACKEND_URL;
  }

  return ENV_API_BASE || FALLBACK_BACKEND_URL;
};

const resolveSocketUrl = () => {
  if (IS_VERCEL || (IS_PROD && !ENV_SOCKET_URL)) {
    return FALLBACK_BACKEND_URL;
  }

  return ENV_SOCKET_URL || FALLBACK_BACKEND_URL;
};

// Final config
export const API_CONFIG = {
  BASE_URL: resolveApiUrl(),
  SOCKET_URL: resolveSocketUrl(),
};

// Warn if env vars are missing in production
if (IS_PROD) {
  if (!ENV_API_BASE) {
    console.warn(
      '[WARN] VITE_API_BASE_URL is not set in .env.production — using fallback:',
      FALLBACK_BACKEND_URL
    );
  }
  if (!ENV_SOCKET_URL) {
    console.warn(
      '[WARN] VITE_SOCKET_URL is not set in .env.production — using fallback:',
      FALLBACK_BACKEND_URL
    );
  }
}

// Helpful debug log (only in dev)
if (IS_DEV) {
  console.log('[API CONFIG]', {
    BASE_URL: API_CONFIG.BASE_URL,
    SOCKET_URL: API_CONFIG.SOCKET_URL,
    MODE: import.meta.env.MODE,
    IS_VERCEL,
  });
}

// Axios instance
export const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: 30000,
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
