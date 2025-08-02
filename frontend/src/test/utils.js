// Test utilities and helpers
// Common functions used across multiple test files

import { render } from '@testing-library/react'

// Custom render function that includes providers (but no Router since App already has one)
export function renderWithProviders(ui, options = {}) {
  return render(ui, options)
}

// For components that need routing but aren't the App itself
export function renderWithRouter(ui, options = {}) {
  // Dynamic import to avoid build issues
  const { BrowserRouter } = require('react-router-dom')
  
  const Wrapper = ({ children }) => {
    return React.createElement(BrowserRouter, null, children)
  }

  return render(ui, { wrapper: Wrapper, ...options })
}

// Mock socket instance for testing
export const mockSocket = {
  on: vi.fn(),
  emit: vi.fn(),
  disconnect: vi.fn(),
  connect: vi.fn(),
  connected: true
}

// Mock user data for testing
export const mockUser = {
  id: 'test-user-123',
  name: 'Test User',
  email: 'test@example.com'
}

// Mock whiteboard data
export const mockWhiteboardData = {
  id: 'test-board-123',
  name: 'Test Whiteboard',
  shapes: [],
  collaborators: [mockUser]
}

// Helper to create mock drawing events
export function createMockDrawingEvent(tool = 'pen', points = [10, 20, 30, 40]) {
  return {
    tool,
    points,
    color: '#000000',
    strokeWidth: 2,
    id: `shape-${Date.now()}`
  }
}

// Helper to wait for async operations
export const waitFor = (ms) => new Promise(resolve => setTimeout(resolve, ms))

// Custom matchers for testing canvas elements
export const canvasMatchers = {
  toBeInCanvas: (element) => {
    const canvas = element.closest('canvas')
    return {
      pass: !!canvas,
      message: () => `Expected element to be inside a canvas`
    }
  }
}
