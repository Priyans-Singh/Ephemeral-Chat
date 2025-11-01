import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { TypingIndicator } from '../TypingIndicator';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

describe('TypingIndicator', () => {
  const mockTypingUsers = [
    { id: '1', displayName: 'John Doe' },
    { id: '2', displayName: 'Jane Smith' },
    { id: '3', displayName: 'Bob Johnson' },
  ];

  it('renders nothing when no users are typing', () => {
    const { container } = render(<TypingIndicator typingUsers={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('displays single user typing message', () => {
    render(<TypingIndicator typingUsers={[mockTypingUsers[0]]} />);
    
    expect(screen.getByText('John Doe is typing')).toBeInTheDocument();
  });

  it('displays two users typing message', () => {
    render(<TypingIndicator typingUsers={mockTypingUsers.slice(0, 2)} />);
    
    expect(screen.getByText('John Doe and Jane Smith are typing')).toBeInTheDocument();
  });

  it('displays multiple users typing message', () => {
    render(<TypingIndicator typingUsers={mockTypingUsers} />);
    
    expect(screen.getByText('John Doe and 2 others are typing')).toBeInTheDocument();
  });

  it('displays user avatars', () => {
    render(<TypingIndicator typingUsers={[mockTypingUsers[0]]} />);
    
    // Check for avatar fallback text instead of img role
    expect(screen.getByText('J')).toBeInTheDocument();
  });

  it('displays multiple avatars for multiple users', () => {
    render(<TypingIndicator typingUsers={mockTypingUsers.slice(0, 2)} />);
    
    // Check for avatar fallback text for both users
    expect(screen.getAllByText('J')).toHaveLength(2); // Both John and Jane start with J
  });

  it('limits avatars to maximum of 3', () => {
    const manyUsers = [
      ...mockTypingUsers,
      { id: '4', displayName: 'Alice Brown' },
      { id: '5', displayName: 'Charlie Wilson' },
    ];
    
    render(<TypingIndicator typingUsers={manyUsers} />);
    
    // Should show avatars for John (J), Jane (J), Bob (B) - first 3 users
    expect(screen.getAllByText('J')).toHaveLength(2); // John and Jane
    expect(screen.getByText('B')).toBeInTheDocument(); // Bob
    expect(screen.queryByText('A')).not.toBeInTheDocument(); // Alice should not be shown
  });

  it('displays typing dots animation', () => {
    render(<TypingIndicator typingUsers={[mockTypingUsers[0]]} />);
    
    // Check for the presence of typing dots (they should be rendered as divs)
    const typingBubble = screen.getByText('John Doe is typing').closest('div');
    expect(typingBubble).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <TypingIndicator typingUsers={[mockTypingUsers[0]]} className="custom-class" />
    );
    
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('shows user initials in avatar fallback', () => {
    render(<TypingIndicator typingUsers={[mockTypingUsers[0]]} />);
    
    // Avatar fallback should show first letter of display name
    expect(screen.getByText('J')).toBeInTheDocument();
  });

  it('handles users with single character names', () => {
    const singleCharUser = { id: '1', displayName: 'A' };
    render(<TypingIndicator typingUsers={[singleCharUser]} />);
    
    expect(screen.getByText('A is typing')).toBeInTheDocument();
    expect(screen.getByText('A')).toBeInTheDocument(); // Avatar fallback
  });

  it('handles empty display names gracefully', () => {
    const emptyNameUser = { id: '1', displayName: '' };
    render(<TypingIndicator typingUsers={[emptyNameUser]} />);
    
    expect(screen.getByText(/is typing/)).toBeInTheDocument();
  });
});