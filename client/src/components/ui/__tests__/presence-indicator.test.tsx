import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PresenceIndicator, TypingIndicator, PresenceStatusBadge } from '../presence-indicator';
import { type UserPresence } from '@/lib/presence-service';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

// Mock presence service
const mockGetUserPresence = vi.fn();
const mockGetPresenceColor = vi.fn();
const mockGetPresenceText = vi.fn();

vi.mock('@/lib/presence-service', () => ({
  presenceService: {
    getUserPresence: mockGetUserPresence,
    getPresenceColor: mockGetPresenceColor,
    getPresenceText: mockGetPresenceText,
  },
}));

describe('PresenceIndicator', () => {
  const mockPresence: UserPresence = {
    userId: 'user1',
    status: 'online',
    lastSeen: new Date(),
    isTyping: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetPresenceColor.mockReturnValue('bg-green-500');
    mockGetPresenceText.mockReturnValue('Online');
  });

  it('should render null when no presence data is available', () => {
    mockGetUserPresence.mockReturnValue(null);
    
    const { container } = render(<PresenceIndicator userId="user1" />);
    
    expect(container.firstChild).toBeNull();
  });

  it('should render presence indicator with provided presence', () => {
    const { container } = render(
      <PresenceIndicator userId="user1" presence={mockPresence} />
    );
    
    expect(container.firstChild).toBeTruthy();
    expect(mockGetUserPresence).not.toHaveBeenCalled(); // Should use provided presence
  });

  it('should fetch presence from service when not provided', () => {
    mockGetUserPresence.mockReturnValue(mockPresence);
    
    render(<PresenceIndicator userId="user1" />);
    
    expect(mockGetUserPresence).toHaveBeenCalledWith('user1');
  });

  it('should render with different sizes', () => {
    const { rerender } = render(
      <PresenceIndicator userId="user1" presence={mockPresence} size="sm" />
    );
    
    let indicator = document.querySelector('[class*="w-2 h-2"]');
    expect(indicator).toBeInTheDocument();

    rerender(<PresenceIndicator userId="user1" presence={mockPresence} size="md" />);
    indicator = document.querySelector('[class*="w-3 h-3"]');
    expect(indicator).toBeInTheDocument();

    rerender(<PresenceIndicator userId="user1" presence={mockPresence} size="lg" />);
    indicator = document.querySelector('[class*="w-4 h-4"]');
    expect(indicator).toBeInTheDocument();
  });

  it('should show text when showText is true', () => {
    render(
      <PresenceIndicator 
        userId="user1" 
        presence={mockPresence} 
        showText={true} 
      />
    );
    
    expect(mockGetPresenceText).toHaveBeenCalledWith(mockPresence);
    expect(screen.getByText('Online')).toBeInTheDocument();
  });

  it('should not show text when showText is false', () => {
    render(
      <PresenceIndicator 
        userId="user1" 
        presence={mockPresence} 
        showText={false} 
      />
    );
    
    expect(screen.queryByText('Online')).not.toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <PresenceIndicator 
        userId="user1" 
        presence={mockPresence} 
        className="custom-class" 
      />
    );
    
    expect(container.querySelector('.custom-class')).toBeInTheDocument();
  });

  it('should render without animation when animate is false', () => {
    render(
      <PresenceIndicator 
        userId="user1" 
        presence={mockPresence} 
        animate={false} 
      />
    );
    
    // Should render without motion wrapper
    expect(screen.getByTitle('Online')).toBeInTheDocument();
  });
});

describe('TypingIndicator', () => {
  const typingPresence: UserPresence = {
    userId: 'user1',
    status: 'online',
    lastSeen: new Date(),
    isTyping: true,
  };

  const notTypingPresence: UserPresence = {
    userId: 'user1',
    status: 'online',
    lastSeen: new Date(),
    isTyping: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render typing indicator when user is typing', () => {
    mockGetUserPresence.mockReturnValue(typingPresence);
    
    render(<TypingIndicator userId="user1" displayName="John" />);
    
    expect(screen.getByText('John is typing...')).toBeInTheDocument();
  });

  it('should not render when user is not typing', () => {
    mockGetUserPresence.mockReturnValue(notTypingPresence);
    
    const { container } = render(<TypingIndicator userId="user1" displayName="John" />);
    
    expect(container.firstChild).toBeNull();
  });

  it('should not render when no presence data', () => {
    mockGetUserPresence.mockReturnValue(null);
    
    const { container } = render(<TypingIndicator userId="user1" displayName="John" />);
    
    expect(container.firstChild).toBeNull();
  });

  it('should apply custom className', () => {
    mockGetUserPresence.mockReturnValue(typingPresence);
    
    const { container } = render(
      <TypingIndicator userId="user1" displayName="John" className="custom-class" />
    );
    
    expect(container.firstChild).toHaveClass('custom-class');
  });
});

describe('PresenceStatusBadge', () => {
  it('should render online status badge', () => {
    render(<PresenceStatusBadge status="online" />);
    
    expect(screen.getByText('Online')).toBeInTheDocument();
  });

  it('should render away status badge', () => {
    render(<PresenceStatusBadge status="away" />);
    
    expect(screen.getByText('Away')).toBeInTheDocument();
  });

  it('should render offline status badge', () => {
    render(<PresenceStatusBadge status="offline" />);
    
    expect(screen.getByText('Offline')).toBeInTheDocument();
  });

  it('should render with different sizes', () => {
    const { rerender } = render(<PresenceStatusBadge status="online" size="sm" />);
    
    let badge = screen.getByText('Online');
    expect(badge).toHaveClass('text-xs');

    rerender(<PresenceStatusBadge status="online" size="md" />);
    badge = screen.getByText('Online');
    expect(badge).toHaveClass('text-sm');

    rerender(<PresenceStatusBadge status="online" size="lg" />);
    badge = screen.getByText('Online');
    expect(badge).toHaveClass('text-base');
  });

  it('should apply custom className', () => {
    render(<PresenceStatusBadge status="online" className="custom-class" />);
    
    const badge = screen.getByText('Online');
    expect(badge).toHaveClass('custom-class');
  });

  it('should apply correct color classes for each status', () => {
    const { rerender } = render(<PresenceStatusBadge status="online" />);
    
    let badge = screen.getByText('Online');
    expect(badge).toHaveClass('bg-green-100', 'text-green-800');

    rerender(<PresenceStatusBadge status="away" />);
    badge = screen.getByText('Away');
    expect(badge).toHaveClass('bg-yellow-100', 'text-yellow-800');

    rerender(<PresenceStatusBadge status="offline" />);
    badge = screen.getByText('Offline');
    expect(badge).toHaveClass('bg-gray-100', 'text-gray-800');
  });
});