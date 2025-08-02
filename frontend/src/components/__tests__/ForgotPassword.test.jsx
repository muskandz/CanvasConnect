import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ForgotPassword from '../../pages/ForgotPassword';
import { auth } from '../../firebaseConfig';
import { ThemeProvider } from '../../contexts/ThemeContext';

// Mock Firebase Auth
vi.mock('../../firebaseConfig', () => ({
  auth: {}
}));

vi.mock('firebase/auth', () => ({
  sendPasswordResetEmail: vi.fn()
}));

// Mock ThemeToggle component
vi.mock('../../components/ThemeToggle', () => ({
  default: () => <div data-testid="theme-toggle">Theme Toggle</div>
}));

const renderForgotPassword = () => {
  return render(
    <ThemeProvider>
      <BrowserRouter>
        <ForgotPassword />
      </BrowserRouter>
    </ThemeProvider>
  );
};

describe('ForgotPassword Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial Render', () => {
    it('renders forgot password form correctly', () => {
      renderForgotPassword();
      
      expect(screen.getByText('Reset your password')).toBeInTheDocument();
      expect(screen.getByText('Enter your email address and we\'ll send you a link to reset your password')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter your email address')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Send reset instructions' })).toBeInTheDocument();
    });

    it('displays navigation links correctly', () => {
      renderForgotPassword();
      
      expect(screen.getByText('Back to Home')).toBeInTheDocument();
      expect(screen.getByText('Back to sign in')).toBeInTheDocument();
      expect(screen.getByText('Sign up for free')).toBeInTheDocument();
    });

    it('renders theme toggle', () => {
      renderForgotPassword();
      
      expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
    });
  });

  describe('Form Interaction', () => {
    it('updates email input value', () => {
      renderForgotPassword();
      
      const emailInput = screen.getByPlaceholderText('Enter your email address');
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      
      expect(emailInput.value).toBe('test@example.com');
    });

    it('requires email input to submit', () => {
      renderForgotPassword();
      
      const submitButton = screen.getByRole('button', { name: 'Send reset instructions' });
      const emailInput = screen.getByPlaceholderText('Enter your email address');
      
      // Try to submit without email
      fireEvent.click(submitButton);
      
      expect(emailInput.checkValidity()).toBe(false);
    });
  });

  describe('Password Reset Process', () => {
    it('shows loading state when submitting', async () => {
      const { sendPasswordResetEmail } = await import('firebase/auth');
      sendPasswordResetEmail.mockResolvedValue();

      renderForgotPassword();
      
      const emailInput = screen.getByPlaceholderText('Enter your email address');
      const submitButton = screen.getByRole('button', { name: 'Send reset instructions' });
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.click(submitButton);
      
      // Check if loading state is shown
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('displays success message after successful reset', async () => {
      const { sendPasswordResetEmail } = await import('firebase/auth');
      sendPasswordResetEmail.mockResolvedValue();

      renderForgotPassword();
      
      const emailInput = screen.getByPlaceholderText('Enter your email address');
      const submitButton = screen.getByRole('button', { name: 'Send reset instructions' });
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Check your email')).toBeInTheDocument();
        expect(screen.getByText(/We've sent password reset instructions to/)).toBeInTheDocument();
      });
    });

    it('displays error message on failure', async () => {
      const { sendPasswordResetEmail } = await import('firebase/auth');
      sendPasswordResetEmail.mockRejectedValue({ code: 'auth/user-not-found' });

      renderForgotPassword();
      
      const emailInput = screen.getByPlaceholderText('Enter your email address');
      const submitButton = screen.getByRole('button', { name: 'Send reset instructions' });
      
      fireEvent.change(emailInput, { target: { value: 'nonexistent@example.com' } });
      fireEvent.submit(submitButton.closest('form'));
      
      await waitFor(() => {
        expect(screen.getByText('No account found with this email address.')).toBeInTheDocument();
      });
    });
  });

  describe('Success State', () => {
    it('shows instructions after email sent', async () => {
      const { sendPasswordResetEmail } = await import('firebase/auth');
      sendPasswordResetEmail.mockResolvedValue();

      renderForgotPassword();
      
      const emailInput = screen.getByPlaceholderText('Enter your email address');
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.submit(emailInput.closest('form'));
      
      await waitFor(() => {
        expect(screen.getByText('What\'s next?')).toBeInTheDocument();
        expect(screen.getByText('• Check your email inbox (and spam folder)')).toBeInTheDocument();
        expect(screen.getByText('• Click the reset link in the email')).toBeInTheDocument();
        expect(screen.getByText('Send to a different email')).toBeInTheDocument();
      });
    });

    it('allows resending to different email', async () => {
      const { sendPasswordResetEmail } = await import('firebase/auth');
      sendPasswordResetEmail.mockResolvedValue();

      renderForgotPassword();
      
      const emailInput = screen.getByPlaceholderText('Enter your email address');
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.submit(emailInput.closest('form'));
      
      await waitFor(() => {
        expect(screen.getByText('Send to a different email')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByText('Send to a different email'));
      
      expect(screen.getByText('Reset your password')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter your email address')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles invalid email error', async () => {
      const { sendPasswordResetEmail } = await import('firebase/auth');
      sendPasswordResetEmail.mockRejectedValue({ code: 'auth/invalid-email' });

      renderForgotPassword();
      
      const emailInput = screen.getByPlaceholderText('Enter your email address');
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      fireEvent.submit(emailInput.closest('form'));
      
      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email address.')).toBeInTheDocument();
      });
    });

    it('handles too many requests error', async () => {
      const { sendPasswordResetEmail } = await import('firebase/auth');
      sendPasswordResetEmail.mockRejectedValue({ code: 'auth/too-many-requests' });

      renderForgotPassword();
      
      const emailInput = screen.getByPlaceholderText('Enter your email address');
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.submit(emailInput.closest('form'));
      
      await waitFor(() => {
        expect(screen.getByText('Too many password reset attempts. Please try again later.')).toBeInTheDocument();
      });
    });

    it('handles generic errors', async () => {
      const { sendPasswordResetEmail } = await import('firebase/auth');
      sendPasswordResetEmail.mockRejectedValue({ code: 'auth/unknown-error' });

      renderForgotPassword();
      
      const emailInput = screen.getByPlaceholderText('Enter your email address');
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.submit(emailInput.closest('form'));
      
      await waitFor(() => {
        expect(screen.getByText('Failed to send password reset email. Please try again.')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper form labels', () => {
      renderForgotPassword();
      
      expect(screen.getByLabelText('Email address')).toBeInTheDocument();
    });

    it('has proper link accessibility', () => {
      renderForgotPassword();
      
      const backToHomeLink = screen.getByRole('link', { name: /back to home/i });
      const backToSignInLink = screen.getByRole('link', { name: /back to sign in/i });
      const signUpLink = screen.getByRole('link', { name: /sign up for free/i });
      
      expect(backToHomeLink).toHaveAttribute('href', '/');
      expect(backToSignInLink).toHaveAttribute('href', '/login');
      expect(signUpLink).toHaveAttribute('href', '/signup');
    });
  });
});
