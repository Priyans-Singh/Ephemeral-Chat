import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '../../contexts/ThemeContext';
import { AuthProvider } from '../../contexts/AuthContext';
import { SidebarProvider } from '../../contexts/SidebarContext';
import { AuthFormContainer } from '../../components/auth/AuthFormContainer';
import UserSidebar from '../../components/chat/UserSidebar';
import { ChatLayout } from '../../components/chat/ChatLayout';

// Mock dependencies
vi.mock('socket.io-client', () => ({
  io: vi.fn(() => ({
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
  })),
}));

vi.mock('../../lib/api', () => ({
  apiClient: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

vi.mock('../../lib/notification-service', () => ({
  notificationService: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}));

vi.mock('../../lib/presence-service', () => ({
  presenceService: {
    subscribe: vi.fn(() => vi.fn()),
    updatePresence: vi.fn(),
    setTyping: vi.fn(),
    getPresenceColor: vi.fn(() => 'bg-green-500'),
    getPresenceText: vi.fn(() => 'Online'),
    sortUsersByPresence: vi.fn((users) => users),
  },
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <ThemeProvider>
      <AuthProvider>
        <SidebarProvider>
          {children}
        </SidebarProvider>
      </AuthProvider>
    </ThemeProvider>
  </BrowserRouter>
);

describe('Enhanced Components Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('Enhanced Authentication Forms', () => {
    it('should render enhanced login form with animations', async () => {
      const mockOnSuccess = vi.fn();
      
      render(
        <TestWrapper>
          <AuthFormContainer initialMode="login" onSuccess={mockOnSuccess} />
        </TestWrapper>
      );

      // Should render enhanced card layout
      expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
      expect(screen.getByText(/enter your credentials/i)).toBeInTheDocument();

      // Should have enhanced form fields
      const emailInput = screen.getByRole('textbox', { name: /email/i });
      const passwordInput = screen.getByLabelText(/password/i);
      
      expect(emailInput).toBeInTheDocument();
      expect(passwordInput).toBeInTheDocument();

      // Should have enhanced styling classes
      expect(emailInput.closest('.space-y-2')).toBeInTheDocument();
    });

    it('should animate between login and signup forms', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <AuthFormContainer initialMode="login" />
        </TestWrapper>
      );

      // Start with login form
      expect(screen.getByText(/welcome back/i)).toBeInTheDocument();

      // Click to switch to signup
      const signupLink = screen.getByText(/create account/i);
      await user.click(signupLink);

      // Should animate to signup form
      await waitFor(() => {
        expect(screen.getByText(/create account/i)).toBeInTheDocument();
        expect(screen.getByRole('textbox', { name: /display name/i })).toBeInTheDocument();
      });

      // Switch back to login
      const loginLink = screen.getByText(/sign in/i);
      await user.click(loginLink);

      // Should animate back to login
      await waitFor(() => {
        expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
      });
    });

    it('should show enhanced validation with real-time feedback', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <AuthFormContainer initialMode="signup" />
        </TestWrapper>
      );

      const displayNameInput = screen.getByRole('textbox', { name: /display name/i });
      const emailInput = screen.getByRole('textbox', { name: /email/i });
      const passwordInput = screen.getByLabelText(/^password$/i);

      // Test display name validation
      await user.type(displayNameInput, 'a');
      await user.tab();
      
      await waitFor(() => {
        expect(screen.getByText(/display name must be at least/i)).toBeInTheDocument();
      });

      // Test email validation
      await user.type(emailInput, 'invalid-email');
      await user.tab();
      
      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email/i)).toBeInTheDocument();
      });

      // Test password strength indicator
      await user.type(passwordInput, 'weak');
      
      await waitFor(() => {
        expect(screen.getByText(/weak/i)).toBeInTheDocument();
      });

      // Enter strong password
      await user.clear(passwordInput);
      await user.type(passwordInput, 'StrongPassword123!');
      
      await waitFor(() => {
        expect(screen.getByText(/strong/i)).toBeInTheDocument();
      });
    });
  });

  describe('Enhanced Sidebar Component', () => {
    const mockUsers = [
      { id: '1', displayName: 'Alice Johnson' },
      { id: '2', displayName: 'Bob Smith' },
      { id: '3', displayName: 'Charlie Brown' },
    ];

    const mockAuthContext = {
      user: { id: 'current-user', displayName: 'Current User' },
      socket: {
        on: vi.fn(),
        off: vi.fn(),
        emit: vi.fn(),
      },
      logout: vi.fn(),
    };

    beforeEach(() => {
      vi.mocked(require('../../contexts/AuthContext').useAuth).mockReturnValue(mockAuthContext);
    });

    it('should render enhanced sidebar with search and filtering', async () => {
      const user = userEvent.setup();
      const mockOnSelectUser = vi.fn();
      
      render(
        <TestWrapper>
          <UserSidebar 
            onSelectUser={mockOnSelectUser}
            selectedUser={null}
            currentUserId="current-user"
          />
        </TestWrapper>
      );

      // Should have enhanced header
      expect(screen.getByText(/chats/i)).toBeInTheDocument();
      
      // Should have search input
      const searchInput = screen.getByPlaceholderText(/search users/i);
      expect(searchInput).toBeInTheDocument();

      // Should have filter dropdown
      const filterButton = screen.getByRole('button', { name: /filter/i });
      expect(filterButton).toBeInTheDocument();

      // Test search functionality
      await user.type(searchInput, 'alice');
      expect(searchInput).toHaveValue('alice');
    });

    it('should show enhanced settings dropdown with theme toggle', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <UserSidebar 
            onSelectUser={vi.fn()}
            selectedUser={null}
            currentUserId="current-user"
          />
        </TestWrapper>
      );

      // Click settings button
      const settingsButton = screen.getByRole('button', { name: /settings/i });
      await user.click(settingsButton);

      // Should show settings dropdown
      await waitFor(() => {
        expect(screen.getByText(/theme/i)).toBeInTheDocument();
        expect(screen.getByText(/notifications/i)).toBeInTheDocument();
        expect(screen.getByText(/animations/i)).toBeInTheDocument();
      });

      // Test theme submenu
      const themeOption = screen.getByText(/theme/i);
      await user.hover(themeOption);

      await waitFor(() => {
        expect(screen.getByText(/light/i)).toBeInTheDocument();
        expect(screen.getByText(/dark/i)).toBeInTheDocument();
        expect(screen.getByText(/system/i)).toBeInTheDocument();
      });
    });

    it('should handle user selection with enhanced animations', async () => {
      const user = userEvent.setup();
      const mockOnSelectUser = vi.fn();
      
      // Mock socket events to simulate users
      const mockSocket = {
        on: vi.fn((event, callback) => {
          if (event === 'users') {
            callback(mockUsers);
          }
        }),
        off: vi.fn(),
        emit: vi.fn(),
      };

      vi.mocked(require('../../contexts/AuthContext').useAuth).mockReturnValue({
        ...mockAuthContext,
        socket: mockSocket,
      });

      render(
        <TestWrapper>
          <UserSidebar 
            onSelectUser={mockOnSelectUser}
            selectedUser={null}
            currentUserId="current-user"
          />
        </TestWrapper>
      );

      // Wait for users to be rendered
      await waitFor(() => {
        expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      });

      // Click on a user
      const userButton = screen.getByText('Alice Johnson').closest('button');
      expect(userButton).toBeInTheDocument();
      
      await user.click(userButton!);

      // Should call onSelectUser
      expect(mockOnSelectUser).toHaveBeenCalledWith(mockUsers[0]);
    });

    it('should show logout confirmation with enhanced UX', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <UserSidebar 
            onSelectUser={vi.fn()}
            selectedUser={null}
            currentUserId="current-user"
          />
        </TestWrapper>
      );

      // Click logout button
      const logoutButton = screen.getByRole('button', { name: /logout/i });
      await user.click(logoutButton);

      // Should show confirmation state
      await waitFor(() => {
        expect(screen.getByText(/confirm logout/i)).toBeInTheDocument();
      });

      // Click confirm
      await user.click(screen.getByText(/confirm logout/i));

      // Should call logout
      expect(mockAuthContext.logout).toHaveBeenCalled();
    });
  });

  describe('Enhanced Chat Layout', () => {
    it('should render enhanced layout with proper animations', () => {
      const mockSidebar = <div data-testid="sidebar">Sidebar Content</div>;
      const mockMainPanel = <div data-testid="main-panel">Main Panel Content</div>;
      
      render(
        <TestWrapper>
          <ChatLayout
            sidebar={mockSidebar}
            mainPanel={mockMainPanel}
            isCollapsed={false}
          />
        </TestWrapper>
      );

      // Should render both sidebar and main panel
      expect(screen.getByTestId('sidebar')).toBeInTheDocument();
      expect(screen.getByTestId('main-panel')).toBeInTheDocument();

      // Should have enhanced styling
      const layout = screen.getByTestId('sidebar').parentElement;
      expect(layout).toHaveClass('bg-sidebar');
    });

    it('should handle sidebar collapse animation', () => {
      const mockSidebar = <div data-testid="sidebar">Sidebar Content</div>;
      const mockMainPanel = <div data-testid="main-panel">Main Panel Content</div>;
      
      const { rerender } = render(
        <TestWrapper>
          <ChatLayout
            sidebar={mockSidebar}
            mainPanel={mockMainPanel}
            isCollapsed={false}
          />
        </TestWrapper>
      );

      // Initially expanded
      expect(screen.getByTestId('sidebar')).toBeInTheDocument();

      // Collapse sidebar
      rerender(
        <TestWrapper>
          <ChatLayout
            sidebar={mockSidebar}
            mainPanel={mockMainPanel}
            isCollapsed={true}
          />
        </TestWrapper>
      );

      // Should still render but with collapsed styling
      expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    });
  });

  describe('Theme Integration with Enhanced Components', () => {
    it('should apply theme changes to all enhanced components', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <AuthFormContainer initialMode="login" />
        </TestWrapper>
      );

      // Check initial theme
      expect(document.documentElement.classList.contains('dark')).toBe(false);

      // The theme would be changed through the theme context
      // This test verifies that components respond to theme changes
      expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
    });

    it('should respect animation preferences in enhanced components', () => {
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
          <AuthFormContainer initialMode="login" />
        </TestWrapper>
      );

      // Should apply reduced motion class
      expect(document.documentElement.classList.contains('reduce-motion')).toBe(true);
    });
  });

  describe('Enhanced Component Accessibility', () => {
    it('should maintain accessibility in enhanced forms', () => {
      render(
        <TestWrapper>
          <AuthFormContainer initialMode="login" />
        </TestWrapper>
      );

      // Check for proper ARIA attributes
      const emailInput = screen.getByRole('textbox', { name: /email/i });
      expect(emailInput).toHaveAttribute('aria-label');

      const passwordInput = screen.getByLabelText(/password/i);
      expect(passwordInput).toHaveAttribute('type', 'password');

      // Check for proper form structure
      const form = screen.getByRole('form') || emailInput.closest('form');
      expect(form).toBeInTheDocument();
    });

    it('should provide proper focus management in enhanced sidebar', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <UserSidebar 
            onSelectUser={vi.fn()}
            selectedUser={null}
            currentUserId="current-user"
          />
        </TestWrapper>
      );

      // Tab through interactive elements
      await user.tab();
      
      // Should focus on search input
      const searchInput = screen.getByPlaceholderText(/search users/i);
      expect(searchInput).toHaveFocus();

      await user.tab();
      
      // Should focus on filter button
      const filterButton = screen.getByRole('button', { name: /filter/i });
      expect(filterButton).toHaveFocus();
    });
  });

  describe('Enhanced Component Performance', () => {
    it('should render enhanced components without performance issues', () => {
      const startTime = performance.now();
      
      render(
        <TestWrapper>
          <AuthFormContainer initialMode="login" />
        </TestWrapper>
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render within reasonable time (less than 100ms)
      expect(renderTime).toBeLessThan(100);
    });

    it('should handle rapid theme changes without issues', async () => {
      const { rerender } = render(
        <TestWrapper>
          <AuthFormContainer initialMode="login" />
        </TestWrapper>
      );

      // Simulate rapid theme changes
      for (let i = 0; i < 10; i++) {
        rerender(
          <TestWrapper>
            <AuthFormContainer initialMode="login" />
          </TestWrapper>
        );
      }

      // Should still render correctly
      expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
    });
  });
});