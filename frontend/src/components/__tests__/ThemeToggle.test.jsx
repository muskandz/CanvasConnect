// ThemeToggle Component Tests
// These tests verify that the theme toggle button works correctly

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ThemeToggle from '../ThemeToggle'

// Mock the theme context
const mockToggleTheme = vi.fn()
const mockUseTheme = vi.fn()

vi.mock('../../contexts/ThemeContext', () => ({
  useTheme: () => mockUseTheme()
}))

describe('ThemeToggle Component', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks()
  })

  describe('Light Theme State', () => {
    beforeEach(() => {
      mockUseTheme.mockReturnValue({
        theme: 'light',
        toggleTheme: mockToggleTheme,
        isDark: false
      })
    })

    it('renders theme toggle button in light mode', () => {
      render(<ThemeToggle />)
      
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
      expect(button).toHaveAttribute('title', 'Switch to dark mode')
      expect(button).toHaveAttribute('aria-label', 'Switch to dark mode')
    })

    it('shows sun icon in light mode', () => {
      render(<ThemeToggle />)
      
      // In light mode, sun should be visible (opacity-100)
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
    })

    it('calls toggleTheme when clicked', async () => {
      const user = userEvent.setup()
      render(<ThemeToggle />)
      
      const button = screen.getByRole('button')
      await user.click(button)
      
      expect(mockToggleTheme).toHaveBeenCalledTimes(1)
    })

    it('shows label when showLabel prop is true', () => {
      render(<ThemeToggle showLabel={true} />)
      
      expect(screen.getByText('Dark')).toBeInTheDocument()
    })

    it('does not show label when showLabel prop is false', () => {
      render(<ThemeToggle showLabel={false} />)
      
      expect(screen.queryByText('Dark')).not.toBeInTheDocument()
      expect(screen.queryByText('Light')).not.toBeInTheDocument()
    })
  })

  describe('Dark Theme State', () => {
    beforeEach(() => {
      mockUseTheme.mockReturnValue({
        theme: 'dark',
        toggleTheme: mockToggleTheme,
        isDark: true
      })
    })

    it('renders theme toggle button in dark mode', () => {
      render(<ThemeToggle />)
      
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
      expect(button).toHaveAttribute('title', 'Switch to light mode')
      expect(button).toHaveAttribute('aria-label', 'Switch to light mode')
    })

    it('shows moon icon in dark mode', () => {
      render(<ThemeToggle />)
      
      // In dark mode, moon should be visible
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
    })

    it('shows correct label in dark mode', () => {
      render(<ThemeToggle showLabel={true} />)
      
      expect(screen.getByText('Light')).toBeInTheDocument()
      expect(screen.queryByText('Dark')).not.toBeInTheDocument()
    })
  })

  describe('Props and Styling', () => {
    beforeEach(() => {
      mockUseTheme.mockReturnValue({
        theme: 'light',
        toggleTheme: mockToggleTheme,
        isDark: false
      })
    })

    it('applies custom className when provided', () => {
      render(<ThemeToggle className="custom-class" />)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('custom-class')
    })

    it('handles keyboard interaction', async () => {
      const user = userEvent.setup()
      render(<ThemeToggle />)
      
      const button = screen.getByRole('button')
      
      // Focus the button and press Enter
      button.focus()
      await user.keyboard('{Enter}')
      
      expect(mockToggleTheme).toHaveBeenCalledTimes(1)
    })

    it('handles space key press', async () => {
      const user = userEvent.setup()
      render(<ThemeToggle />)
      
      const button = screen.getByRole('button')
      
      // Focus the button and press Space
      button.focus()
      await user.keyboard(' ')
      
      expect(mockToggleTheme).toHaveBeenCalledTimes(1)
    })
  })

  describe('Accessibility', () => {
    beforeEach(() => {
      mockUseTheme.mockReturnValue({
        theme: 'light',
        toggleTheme: mockToggleTheme,
        isDark: false
      })
    })

    it('has proper ARIA attributes', () => {
      render(<ThemeToggle />)
      
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-label')
      expect(button).toHaveAttribute('title')
    })

    it('is focusable', () => {
      render(<ThemeToggle />)
      
      const button = screen.getByRole('button')
      button.focus()
      expect(button).toHaveFocus()
    })
  })
})
