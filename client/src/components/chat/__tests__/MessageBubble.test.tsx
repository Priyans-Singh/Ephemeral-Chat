import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { MessageBubble, type MessageData } from '../MessageBubble';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

describe('MessageBubble', () => {
  const mockMessage: MessageData = {
    id: '1',
    content: 'Hello, world!',
    createdAt: '2024-01-01T12:00:00Z',
    sender: {
      id: 'sender-1',
      displayName: 'John Doe',
    },
    recipient: {
      id: 'recipient-1',
      displayName: 'Jane Smith',
    },
  };

  it('renders message content correctly', () => {
    render(
      <MessageBubble
        message={mockMessage}
        isCurrentUser={false}
      />
    );

    expect(screen.getByText('Hello, world!')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('applies correct styling for current user messages', () => {
    render(
      <MessageBubble
        message={mockMessage}
        isCurrentUser={true}
      />
    );

    const messageBubble = screen.getByText('Hello, world!').closest('div');
    expect(messageBubble).toHaveClass('bg-gradient-to-br', 'from-blue-500', 'to-blue-600');
  });

  it('applies correct styling for received messages', () => {
    render(
      <MessageBubble
        message={mockMessage}
        isCurrentUser={false}
      />
    );

    const messageBubble = screen.getByText('Hello, world!').closest('div');
    expect(messageBubble).toHaveClass('bg-card', 'text-card-foreground');
  });

  it('shows sender name for received messages', () => {
    render(
      <MessageBubble
        message={mockMessage}
        isCurrentUser={false}
      />
    );

    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('does not show sender name for current user messages', () => {
    render(
      <MessageBubble
        message={mockMessage}
        isCurrentUser={true}
      />
    );

    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
  });

  it('displays avatar when showAvatar is true', () => {
    render(
      <MessageBubble
        message={mockMessage}
        isCurrentUser={false}
        showAvatar={true}
      />
    );

    // Check for avatar fallback text instead of img role
    expect(screen.getByText('J')).toBeInTheDocument();
  });

  it('hides avatar when showAvatar is false', () => {
    render(
      <MessageBubble
        message={mockMessage}
        isCurrentUser={false}
        showAvatar={false}
      />
    );

    // Check that avatar fallback text is not present
    expect(screen.queryByText('J')).not.toBeInTheDocument();
  });

  it('displays timestamp when showTimestamp is true', () => {
    render(
      <MessageBubble
        message={mockMessage}
        isCurrentUser={false}
        showTimestamp={true}
      />
    );

    // Should show formatted time (format may vary based on locale)
    expect(screen.getByText(/Jan 1.*PM/)).toBeInTheDocument();
  });

  it('hides timestamp when showTimestamp is false', () => {
    render(
      <MessageBubble
        message={mockMessage}
        isCurrentUser={false}
        showTimestamp={false}
      />
    );

    expect(screen.queryByText(/Jan 1.*PM/)).not.toBeInTheDocument();
  });

  it('displays message status for current user messages', () => {
    const messageWithStatus: MessageData = {
      ...mockMessage,
      status: 'delivered',
    };

    render(
      <MessageBubble
        message={messageWithStatus}
        isCurrentUser={true}
      />
    );

    // Should show status indicator container
    const messageContainer = screen.getByText('Hello, world!').closest('div');
    const statusContainer = messageContainer?.querySelector('.absolute');
    expect(statusContainer).toBeInTheDocument();
  });

  it('does not display message status for received messages', () => {
    const messageWithStatus: MessageData = {
      ...mockMessage,
      status: 'delivered',
    };

    render(
      <MessageBubble
        message={messageWithStatus}
        isCurrentUser={false}
      />
    );

    // Should not show status indicator for received messages
    // Check that there's no status container
    const messageContainer = screen.getByText('Hello, world!').closest('div');
    expect(messageContainer?.querySelector('.absolute')).not.toBeInTheDocument();
  });

  it('handles multiline message content', () => {
    const multilineMessage: MessageData = {
      ...mockMessage,
      content: 'Line 1\nLine 2\nLine 3',
    };

    render(
      <MessageBubble
        message={multilineMessage}
        isCurrentUser={false}
      />
    );

    // Check that the content contains all lines
    expect(screen.getByText(/Line 1/)).toBeInTheDocument();
    expect(screen.getByText(/Line 2/)).toBeInTheDocument();
    expect(screen.getByText(/Line 3/)).toBeInTheDocument();
  });

  it('formats timestamp correctly for today', () => {
    const todayMessage: MessageData = {
      ...mockMessage,
      createdAt: new Date().toISOString(),
    };

    render(
      <MessageBubble
        message={todayMessage}
        isCurrentUser={false}
        showTimestamp={true}
      />
    );

    // Should show time without date for today's messages
    const timeRegex = /\d{1,2}:\d{2}\s?(AM|PM)/i;
    expect(screen.getByText(timeRegex)).toBeInTheDocument();
  });

  it('formats timestamp correctly for yesterday', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const yesterdayMessage: MessageData = {
      ...mockMessage,
      createdAt: yesterday.toISOString(),
    };

    render(
      <MessageBubble
        message={yesterdayMessage}
        isCurrentUser={false}
        showTimestamp={true}
      />
    );

    // Should show "Yesterday" with time
    expect(screen.getByText(/Yesterday/)).toBeInTheDocument();
  });
});