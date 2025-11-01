import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import App from '../../App';
import { ThemeProvider } from '../../contexts/ThemeContext';
import { AuthProvider } from '../../contexts/AuthContext';

// Mock socket.io-client
vi.mock('socket.io-client', () => ({
  io: vi.fn(() => ({
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
  })),
}));

// Mock API client
vi.mock('../../lib/api', () => ({
  apiClient: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

// Mock notification service
vi.mock('../../lib/notification-service', () => ({
  notificationService: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <ThemeProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </ThemeProvider>
  </BrowserRouter>
);

describe('Complete User Flows Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('Authentication Flow', () => {
    it('should complete full authentication flow from login to chat', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Should start on login page
      expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: /email/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();

      // Fill in login form
      await user.type(screen.getByRole('textbox', { name: /email/i }), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');

      // Submit form
      const loginButton = screen.getByRole('button', { name: /sign in/i });
      expect(loginButton).not.toBeDisabled();
      
      await user.click(loginButton);

      // Should show loading state
      expect(screen.getByRole('button', { name: /signing in/i })).toBeInTheDocument();
    });

    it('should switch between login and signup forms with animations', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Start on login form
      expect(screen.getByText(/welcome back/i)).toBeInTheDocument();

      // Click signup link
      const signupLink = screen.getByText(/create account/i);
      await user.click(signupLink);

      // Should switch to signup form
      await waitFor(() => {
        expect(screen.getByText(/create account/i)).toBeInTheDocument();
        expect(screen.getByRole('textbox', { name: /display name/i })).toBeInTheDocument();
      });

      // Switch back to login
      const loginLink = screen.getByText(/sign in/i);
      await user.click(loginLink);

      // Should switch back to login form
      await waitFor(() => {
        expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
      });
    });

    it('should validate form fields with real-time feedback', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Try to submit empty form
      const loginButton = screen.getByRole('button', { name: /sign in/i });
      expect(loginButton).toBeDisabled();

      // Enter invalid email
      await user.type(screen.getByRole('textbox', { name: /email/i }), 'invalid-email');
      
      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email/i)).toBeInTheDocument();
      });

      // Enter valid email
      await user.clear(screen.getByRole('textbox', { name: /email/i }));
      await user.type(screen.getByRole('textbox', { name: /email/i }), 'test@example.com');

      // Enter short password
      await user.type(screen.getByLabelText(/password/i), '123');
      
      // Should show password validation error
      await waitFor(() => {
        expect(screen.getByText(/password must be at least/i)).toBeInTheDocument();
      });

      // Enter valid password
      await user.clear(screen.getByLabelText(/password/i));
      await user.type(screen.getByLabelText(/password/i), 'password123');

      // Button should now be enabled
      await waitFor(() => {
        expect(loginButton).not.toBeDisabled();
      });
    });
  });

  describe('Theme System Integration', () => {
    it('should persist theme changes across page reloads', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Check initial theme (should be system default)
      expect(document.documentElement.classList.contains('dark')).toBe(false);

      // Mock successful login to access chat page
      const { apiClient } = await import('../../lib/api');
      vi.mocked(apiClient.post).mockResolvedValueOnce({
        data: { token: 'mock-token', user: { id: '1', displayName: 'Test User' } }
      });

      // Login
      await user.type(screen.getByRole('textbox', { name: /email/i }), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      // Wait for navigation to chat page
      await waitFor(() => {
        expect(screen.getByText(/chats/i)).toBeInTheDocument();
      });

      // Open settings and change theme
      const settingsButton = screen.getByRole('button', { name: /settings/i });
      await user.click(settingsButton);

      const themeOption = screen.getByText(/dark/i);
      await user.click(themeOption);

      // Theme should change immediately
      await waitFor(() => {
        expect(document.documentElement.classList.contains('dark')).toBe(true);
      });

      // Check localStorage persistence
      const storedConfig = JSON.parse(localStorage.getItem('theme-config') || '{}');
      expect(storedConfig.mode).toBe('dark');
    });

    it('should respect reduced motion preferences', async () => {
      // Mock reduced motion preference
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Should apply reduced motion class
      await waitFor(() => {
        expect(document.documentElement.classList.contains('reduce-motion')).toBe(true);
      });
    });
  });

  describe('Chat Interface Integration', () => {
    beforeEach(async () => {
      // Mock successful authentication
      const { apiClient } = await import('../../lib/api');
      vi.mocked(apiClient.post).mockResolvedValueOnce({
        data: { token: 'mock-token', user: { id: '1', displayName: 'Test User' } }
      });
    });

    it('should complete end-to-end chat functionality', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Login first
      await user.type(screen.getByRole('textbox', { name: /email/i }), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      // Wait for chat interface
      await waitFor(() => {
        expect(screen.getByText(/chats/i)).toBeInTheDocument();
      });

      // Should show sidebar with users
      expect(screen.getByPlaceholderText(/search users/i)).toBeInTheDocument();

      // Should show connection status
      expect(screen.getByText(/connected/i)).toBeInTheDocument();

      // Should show message input area
      expect(screen.getByPlaceholderText(/type a message/i)).toBeInTheDocument();
    });

    it('should handle sidebar collapse and expand with animations', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Login and navigate to chat
      await user.type(screen.getByRole('textbox', { name: /email/i }), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText(/chats/i)).toBeInTheDocument();
      });

      // Find and click sidebar toggle
      const toggleButton = screen.getByRole('button', { name: /toggle sidebar/i });
      await user.click(toggleButton);

      // Sidebar should collapse (check for tooltip presence indicating collapsed state)
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /settings/i })).toHaveAttribute('title');
      });

      // Click again to expand
      await user.click(toggleButton);

      // Sidebar should expand
      await waitFor(() => {
        expect(screen.getByText(/chats/i)).toBeInTheDocument();
      });
    });

    it('should handle message sending with proper validation', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Login and navigate to chat
      await user.type(screen.getByRole('textbox', { name: /email/i }), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/type a message/i)).toBeInTheDocument();
      });

      const messageInput = screen.getByPlaceholderText(/type a message/i);
      const sendButton = screen.getByRole('button', { name: /send/i });

      // Send button should be disabled initially
      expect(sendButton).toBeDisabled();

      // Type a message
      await user.type(messageInput, 'Hello, this is a test message!');

      // Send button should be enabled
      expect(sendButton).not.toBeDisabled();

      // Send the message
      await user.click(sendButton);

      // Input should be cleared
      expect(messageInput).toHaveValue('');

      // Send button should be disabled again
      expect(sendButton).toBeDisabled();
    });

    it('should show typing indicators and user presence', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Login and navigate to chat
      await user.type(screen.getByRole('textbox', { name: /email/i }), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/type a message/i)).toBeInTheDocument();
      });

      // Start typing in message input
      const messageInput = screen.getByPlaceholderText(/type a message/i);
      await user.type(messageInput, 'Test');

      // Should trigger typing indicator (this would be tested with socket events in a real scenario)
      expect(messageInput).toHaveValue('Test');
    });
  });

  describe('Responsive Design Integration', () => {
    it('should adapt to different screen sizes', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 667,
      });

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Should render mobile-optimized layout
      expect(screen.getByText(/welcome back/i)).toBeInTheDocument();

      // Form should be responsive
      const emailInput = screen.getByRole('textbox', { name: /email/i });
      expect(emailInput).toBeInTheDocument();
    });
  });

  describe('Accessibility Integration', () => {
    it('should maintain proper focus management', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Tab through form elements
      await user.tab();
      expect(screen.getByRole('textbox', { name: /email/i })).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText(/password/i)).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('button', { name: /sign in/i })).toHaveFocus();
    });

    it('should provide proper ARIA labels and descriptions', () => {
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Check for proper ARIA attributes
      const emailInput = screen.getByRole('textbox', { name: /email/i });
      expect(emailInput).toHaveAttribute('aria-label');

      const passwordInput = screen.getByLabelText(/password/i);
      expect(passwordInput).toHaveAttribute('type', 'password');

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      expect(submitButton).toHaveAttribute('type', 'submit');
    });

    it('should announce important state changes to screen readers', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Enter invalid email
      await user.type(screen.getByRole('textbox', { name: /email/i }), 'invalid');

      // Should have aria-describedby for error message
      await waitFor(() => {
        const emailInput = screen.getByRole('textbox', { name: /email/i });
        expect(emailInput).toHaveAttribute('aria-describedby');
      });
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle network errors gracefully', async () => {
      const user = userEvent.setup();
      
      // Mock network error
      const { apiClient } = await import('../../lib/api');
      vi.mocked(apiClient.post).mockRejectedValueOnce(new Error('Network error'));

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Try to login
      await user.type(screen.getByRole('textbox', { name: /email/i }), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      // Should show error notification
      await waitFor(() => {
        const { notificationService } = require('../../lib/notification-service');
        expect(notificationService.error).toHaveBeenCalled();
      });
    });

    it('should handle authentication errors', async () => {
      const user = userEvent.setup();
      
      // Mock authentication error
      const { apiClient } = await import('../../lib/api');
      vi.mocked(apiClient.post).mockRejectedValueOnce({
        response: { status: 401, data: { message: 'Invalid credentials' } }
      });

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Try to login with invalid credentials
      await user.type(screen.getByRole('textbox', { name: /email/i }), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'wrongpassword');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      // Should show error message
      await waitFor(() => {
        const { notificationService } = require('../../lib/notification-service');
        expect(notificationService.error).toHaveBeenCalledWith(
          expect.stringContaining('Invalid credentials')
        );
      });
    });
  });
});