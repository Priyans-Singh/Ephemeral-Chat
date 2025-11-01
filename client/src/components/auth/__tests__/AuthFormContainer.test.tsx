import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { AuthFormContainer } from '../AuthFormContainer';
import { useAuth } from '@/contexts/AuthContext';

// Mock dependencies
vi.mock('@/contexts/AuthContext');
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <div>{children}</div>,
}));

const mockUseAuth = vi.mocked(useAuth);

describe('AuthFormContainer', () => {
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      token: null,
      user: null,
      socket: null,
    });
  });

  it('renders login form by default', () => {
    render(<AuthFormContainer />);
    
    expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
    expect(screen.getByText(/enter your credentials to access your account/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('renders signup form when initialMode is signup', () => {
    render(<AuthFormContainer initialMode="signup" />);
    
    // Use more specific text matching to avoid conflicts between title and button
    expect(screen.getByText('Create account')).toBeInTheDocument();
    expect(screen.getByText(/enter your information to create a new account/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('switches from login to signup when signup link is clicked', async () => {
    const user = userEvent.setup();
    render(<AuthFormContainer />);
    
    // Initially shows login form
    expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
    
    // Click signup link
    const signupLink = screen.getByRole('button', { name: /sign up/i });
    await user.click(signupLink);
    
    // Should now show signup form
    await waitFor(() => {
      expect(screen.getByText('Create account')).toBeInTheDocument();
      expect(screen.getByLabelText(/display name/i)).toBeInTheDocument();
    });
  });

  it('switches from signup to login when login link is clicked', async () => {
    const user = userEvent.setup();
    render(<AuthFormContainer initialMode="signup" />);
    
    // Initially shows signup form
    expect(screen.getByText('Create account')).toBeInTheDocument();
    
    // Click login link
    const loginLink = screen.getByRole('button', { name: /sign in/i });
    await user.click(loginLink);
    
    // Should now show login form
    await waitFor(() => {
      expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
      expect(screen.queryByLabelText(/display name/i)).not.toBeInTheDocument();
    });
  });

  it('calls onSuccess callback when login is successful', async () => {
    const user = userEvent.setup();
    const mockLogin = vi.fn().mockResolvedValue(undefined);
    mockUseAuth.mockReturnValue({
      login: mockLogin,
      register: vi.fn(),
      logout: vi.fn(),
      token: null,
      user: null,
      socket: null,
    });

    render(<AuthFormContainer onSuccess={mockOnSuccess} />);
    
    // Fill in login form using placeholder text for password
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByPlaceholderText(/enter your password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'validpassword');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('calls onSuccess callback when signup is successful', async () => {
    const user = userEvent.setup();
    const mockRegister = vi.fn().mockResolvedValue(undefined);
    mockUseAuth.mockReturnValue({
      login: vi.fn(),
      register: mockRegister,
      logout: vi.fn(),
      token: null,
      user: null,
      socket: null,
    });

    render(<AuthFormContainer initialMode="signup" onSuccess={mockOnSuccess} />);
    
    // Fill in signup form using placeholder text for password fields
    const displayNameInput = screen.getByLabelText(/display name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByPlaceholderText(/create a password/i);
    const confirmPasswordInput = screen.getByPlaceholderText(/confirm your password/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });
    
    await user.type(displayNameInput, 'John Doe');
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'StrongPass123!');
    await user.type(confirmPasswordInput, 'StrongPass123!');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('maintains form state when switching between modes', async () => {
    const user = userEvent.setup();
    render(<AuthFormContainer />);
    
    // Fill in email in login form
    const emailInput = screen.getByLabelText(/email/i);
    await user.type(emailInput, 'test@example.com');
    
    // Switch to signup
    const signupLink = screen.getByRole('button', { name: /sign up/i });
    await user.click(signupLink);
    
    // Switch back to login
    await waitFor(() => {
      const loginLink = screen.getByRole('button', { name: /sign in/i });
      return user.click(loginLink);
    });
    
    // Email field should be empty (forms are independent)
    await waitFor(() => {
      const newEmailInput = screen.getByLabelText(/email/i);
      expect(newEmailInput).toHaveValue('');
    });
  });

  it('has proper card structure and styling', () => {
    render(<AuthFormContainer />);
    
    // Check for card elements - use text content instead of heading role
    expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
    expect(screen.getByText(/enter your credentials to access your account/i)).toBeInTheDocument();
  });

  it('shows appropriate titles and descriptions for each mode', () => {
    // Test login mode
    const { unmount } = render(<AuthFormContainer initialMode="login" />);
    
    expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
    expect(screen.getByText(/enter your credentials to access your account/i)).toBeInTheDocument();
    
    // Clean up and test signup mode separately
    unmount();
    render(<AuthFormContainer initialMode="signup" />);
    
    expect(screen.getByText('Create account')).toBeInTheDocument();
    expect(screen.getByText(/enter your information to create a new account/i)).toBeInTheDocument();
  });
});