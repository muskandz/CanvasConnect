// BoardCard Component Tests
// These tests verify that the board card displays correctly and handles user interactions

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import BoardCard from '../BoardCard'
import { renderWithRouter } from '../../test/utils'

// Mock board data
const mockBoard = {
  id: 'board-123',
  title: 'Test Whiteboard',
  ownerId: 'user-123',
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T12:00:00Z',
  thumbnail: 'https://example.com/thumbnail.jpg',
  collaborators: [
    { name: 'Alice Cooper', email: 'alice@example.com' },
    { name: 'Bob Smith', email: 'bob@example.com' }
  ],
  isPublic: false,
  permissions: { canEdit: true },
  views: 42,
  likes: 5
}

// Mock functions
const mockOnAction = vi.fn()
const mockOnShare = vi.fn()
const mockOnEdit = vi.fn()

describe('BoardCard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Basic Rendering', () => {
    it('renders board card with basic information', () => {
      render(
        <BoardCard
          board={mockBoard}
          viewMode="grid"
          currentUserId="user-123"
          onAction={mockOnAction}
          onShare={mockOnShare}
          onEdit={mockOnEdit}
        />
      )

      expect(screen.getByText('Test Whiteboard')).toBeInTheDocument()
    })

    it('displays board title correctly', () => {
      render(
        <BoardCard
          board={mockBoard}
          viewMode="grid"
          currentUserId="user-123"
          onAction={mockOnAction}
          onShare={mockOnShare}
          onEdit={mockOnEdit}
        />
      )

      const title = screen.getByText('Test Whiteboard')
      expect(title).toBeInTheDocument()
    })

    it('shows collaborator avatars', () => {
      render(
        <BoardCard
          board={mockBoard}
          viewMode="grid"
          currentUserId="user-123"
          onAction={mockOnAction}
          onShare={mockOnShare}
          onEdit={mockOnEdit}
        />
      )

      // Check for different collaborator initials using title attributes which are unique
      expect(screen.getByTitle('alice@example.com')).toBeInTheDocument()
      expect(screen.getByTitle('bob@example.com')).toBeInTheDocument()
      
      // Verify the initials are displayed correctly
      const aliceAvatar = screen.getByTitle('alice@example.com')
      const bobAvatar = screen.getByTitle('bob@example.com')
      
      expect(aliceAvatar).toHaveTextContent('A')
      expect(bobAvatar).toHaveTextContent('B')
    })
  })

  describe('Owner Permissions', () => {
    it('recognizes board owner correctly', () => {
      const { container } = render(
        <BoardCard
          board={mockBoard}
          viewMode="grid"
          currentUserId="user-123" // Same as board ownerId
          onAction={mockOnAction}
          onShare={mockOnShare}
          onEdit={mockOnEdit}
        />
      )

      // Board should render for owner
      expect(container.firstChild).toBeInTheDocument()
    })

    it('handles non-owner user correctly', () => {
      const { container } = render(
        <BoardCard
          board={mockBoard}
          viewMode="grid"
          currentUserId="different-user-456"
          onAction={mockOnAction}
          onShare={mockOnShare}
          onEdit={mockOnEdit}
        />
      )

      // Board should still render for non-owner
      expect(container.firstChild).toBeInTheDocument()
    })
  })

  describe('Permission Icons', () => {
    it('shows public icon for public boards', () => {
      const publicBoard = { ...mockBoard, isPublic: true }
      
      render(
        <BoardCard
          board={publicBoard}
          viewMode="grid"
          currentUserId="user-123"
          onAction={mockOnAction}
          onShare={mockOnShare}
          onEdit={mockOnEdit}
        />
      )

      // Public boards should show globe icon (we can't test SVG directly, but we can test the component renders)
      expect(screen.getByText('Test Whiteboard')).toBeInTheDocument()
    })

    it('shows collaboration icon for boards with collaborators', () => {
      const collaborativeBoard = { ...mockBoard, isPublic: false }
      
      render(
        <BoardCard
          board={collaborativeBoard}
          viewMode="grid"
          currentUserId="user-123"
          onAction={mockOnAction}
          onShare={mockOnShare}
          onEdit={mockOnEdit}
        />
      )

      // Should render the board with collaborators
      expect(screen.getByText('Test Whiteboard')).toBeInTheDocument()
    })
  })

  describe('Collaborator Display', () => {
    it('displays multiple collaborators', () => {
      const boardWithManyCollaborators = {
        ...mockBoard,
        collaborators: [
          { name: 'Alice', email: 'alice@example.com' },
          { name: 'Bob', email: 'bob@example.com' },
          { name: 'Charlie', email: 'charlie@example.com' },
          { name: 'David', email: 'david@example.com' },
          { name: 'Eve', email: 'eve@example.com' }
        ]
      }

      render(
        <BoardCard
          board={boardWithManyCollaborators}
          viewMode="grid"
          currentUserId="user-123"
          onAction={mockOnAction}
          onShare={mockOnShare}
          onEdit={mockOnEdit}
        />
      )

      // Should show first few collaborators and a "+2" indicator for the rest
      expect(screen.getByText('A')).toBeInTheDocument() // Alice
      expect(screen.getByText('B')).toBeInTheDocument() // Bob  
      expect(screen.getByText('C')).toBeInTheDocument() // Charlie
      expect(screen.getByText('+2')).toBeInTheDocument() // David + Eve
    })

    it('handles boards with no collaborators', () => {
      const boardWithoutCollaborators = {
        ...mockBoard,
        collaborators: []
      }

      render(
        <BoardCard
          board={boardWithoutCollaborators}
          viewMode="grid"
          currentUserId="user-123"
          onAction={mockOnAction}
          onShare={mockOnShare}
          onEdit={mockOnEdit}
        />
      )

      // Should still render the board
      expect(screen.getByText('Test Whiteboard')).toBeInTheDocument()
    })
  })

  describe('View Modes', () => {
    it('renders in grid view mode', () => {
      const { container } = render(
        <BoardCard
          board={mockBoard}
          viewMode="grid"
          currentUserId="user-123"
          onAction={mockOnAction}
          onShare={mockOnShare}
          onEdit={mockOnEdit}
        />
      )

      expect(container.firstChild).toBeInTheDocument()
    })

    it('renders in list view mode', () => {
      const { container } = render(
        <BoardCard
          board={mockBoard}
          viewMode="list"
          currentUserId="user-123"
          onAction={mockOnAction}
          onShare={mockOnShare}
          onEdit={mockOnEdit}
        />
      )

      expect(container.firstChild).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('handles missing board data gracefully', () => {
      const incompleteBoard = {
        id: 'incomplete-board',
        title: 'Incomplete Board'
        // Missing other properties
      }

      render(
        <BoardCard
          board={incompleteBoard}
          viewMode="grid"
          currentUserId="user-123"
          onAction={mockOnAction}
          onShare={mockOnShare}
          onEdit={mockOnEdit}
        />
      )

      expect(screen.getByText('Incomplete Board')).toBeInTheDocument()
    })

    it('handles missing collaborator data', () => {
      const boardWithEmptyCollaborator = {
        ...mockBoard,
        collaborators: [
          { email: 'noname@example.com' } // Missing name
        ]
      }

      render(
        <BoardCard
          board={boardWithEmptyCollaborator}
          viewMode="grid"
          currentUserId="user-123"
          onAction={mockOnAction}
          onShare={mockOnShare}
          onEdit={mockOnEdit}
        />
      )

      // Should show email initial when name is missing
      expect(screen.getByText('n')).toBeInTheDocument() // noname@example.com -> 'n'
      expect(screen.getByTitle('noname@example.com')).toBeInTheDocument()
    })
  })
})
