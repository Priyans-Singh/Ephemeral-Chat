import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { SignupForm } from '../SignupForm';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// Mock dependencies
vi.mock('@/contexts/AuthContext');
vi.mock('sonner');
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

const mockUseAuth = vi.mocked(useAuth);
const mockToast = vi.mocked(toast);

describe('SignupForm', () => {
  const mockRegister = vi.fn();
  const mockOnSuccess = vi.fn();
  const mockOnSwitchToLogin = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      login: vi.fn(),
      register: mockRegister,
      logout: vi.fn(),
      token: null,
      user: null,
      socket: null,
    });
  });

  it('renders signup form with all required fields', () => {
    render(<SignupForm />);
    
    expect(screen.getByLabelText(/display name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/create a password/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/confirm your password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument();
  });

  it('validates display name field', async () => {
    const user = userEvent.setup();
    render(<SignupForm />);
    
    const displayNameInput = screen.getByLabelText(/display name/i);
    
    // Test too short display name
    await user.type(displayNameInput, 'a');
    await user.tab();
    
    await waitFor(() => {
      expect(screen.getByText(/display name must be at least 2 characters/i)).toBeInTheDocument();
    });
  });

  it('validates email field', async () => {
    const user = userEvent.setup();
    render(<SignupForm />);
    
    const emailInput = screen.getByLabelText(/email/i);
    
    // Test invalid email
    await user.type(emailInput, 'invalid-email');
    await user.tab();
    
    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
    });
  });

  it('shows password strength indicator', async () => {
    const user = userEvent.setup();
    render(<SignupForm />);
    
    const passwordInput = screen.getByPlaceholderText(/create a password/i);
    
    // Type a weak password
    await user.type(passwordInput, 'weak');
    
    await waitFor(() => {
      expect(screen.getByText(/password strength:/i)).toBeInTheDocument();
      expect(screen.getByText(/weak/i)).toBeInTheDocument();
    });
  });

  it('validates password confirmation', async () => {
    const user = userEvent.setup();
    render(<SignupForm />);
    
    const passwordInput = screen.getByPlaceholderText(/create a password/i);
    const confirmPasswordInput = screen.getByPlaceholderText(/confirm your password/i);
    
    // Type different passwords
    await user.type(passwordInput, 'StrongPass123!');
    await user.type(confirmPasswordInput, 'DifferentPass123!');
    await user.tab();
    
    await waitFor(() => {
      expect(screen.getByText(/passwords don't match/i)).toBeInTheDocument();
    });
  });

  it('disables submit button when form is invalid', () => {
    render(<SignupForm />);
    
    const submitButton = screen.getByRole('button', { name: /create account/i });
    expect(submitButton).toBeDisabled();
  });

  it('calls register function with correct data on form submission', async () => {
    const user = userEvent.setup();
    mockRegister.mockResolvedValue(undefined);
    
    render(<SignupForm onSuccess={mockOnSuccess} />);
    
    const displayNameInput = screen.getByLabelText(/display name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByPlaceholderText(/create a password/i);
    const confirmPasswordInput = screen.getByPlaceholderText(/confirm your password/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });
    
    // Fill in data
    await user.type(displayNameInput, 'John Doe');
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'StrongPass123!');
    await user.type(confirmPasswordInput, 'StrongPass123!');
    
    // Submit form
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        displayName: 'John Doe',
        email: 'test@example.com',
        password: 'StrongPass123!',
      });
    });
  });

  it('calls onSuccess callback after successful registration', async () => {
    const user = userEvent.setup();
    mockRegister.mockResolvedValue(undefined);
    
    render(<SignupForm onSuccess={mockOnSuccess} />);
    
    const displayNameInput = screen.getByLabelText(/display name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByPlaceholderText(/create a password/i);
    const confirmPasswordInput = screen.getByPlaceholderText(/confirm your password/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });
    
    // Fill in data and submit
    await user.type(displayNameInput, 'John Doe');
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'StrongPass123!');
    await user.type(confirmPasswordInput, 'StrongPass123!');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('shows error toast on registration failure', async () => {
    const user = userEvent.setup();
    const error = new Error('Email already exists');
    mockRegister.mockRejectedValue(error);
    
    render(<SignupForm />);
    
    const displayNameInput = screen.getByLabelText(/display name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByPlaceholderText(/create a password/i);
    const confirmPasswordInput = screen.getByPlaceholderText(/confirm your password/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });
    
    // Fill in data and submit
    await user.type(displayNameInput, 'John Doe');
    await user.type(emailInput, 'existing@example.com');
    await user.type(passwordInput, 'StrongPass123!');
    await user.type(confirmPasswordInput, 'StrongPass123!');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalled();
    });
  });

  it('calls onSwitchToLogin when login link is clicked', async () => {
    const user = userEvent.setup();
    render(<SignupForm onSwitchToLogin={mockOnSwitchToLogin} />);
    
    const loginLink = screen.getByRole('button', { name: /sign in/i });
    await user.click(loginLink);
    
    expect(mockOnSwitchToLogin).toHaveBeenCalled();
  });
});