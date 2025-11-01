import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MessageInput } from '../MessageInput';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

// Mock EmojiPicker and FileAttachment components
vi.mock('../EmojiPicker', () => ({
  EmojiPicker: ({ onEmojiSelect }: { onEmojiSelect: (emoji: string) => void }) => (
    <button onClick={() => onEmojiSelect('😀')} data-testid="emoji-picker">Emoji Picker</button>
  ),
}));

vi.mock('../FileAttachment', () => ({
  FileAttachment: ({ onFileSelect }: { onFileSelect: (files: File[]) => void }) => (
    <button onClick={() => onFileSelect([new File(['test'], 'test.txt')])}>
      File Attachment
    </button>
  ),
}));

describe('MessageInput', () => {
  const mockOnSendMessage = vi.fn();
  const mockOnTypingStart = vi.fn();
  const mockOnTypingStop = vi.fn();

  const defaultProps = {
    onSendMessage: mockOnSendMessage,
    onTypingStart: mockOnTypingStart,
    onTypingStop: mockOnTypingStop,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders textarea and send button', () => {
    render(<MessageInput {...defaultProps} />);

    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
  });

  it('updates textarea value when typing', async () => {
    const user = userEvent.setup();
    render(<MessageInput {...defaultProps} />);

    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'Hello world');

    expect(textarea).toHaveValue('Hello world');
  });

  it('calls onSendMessage when form is submitted', async () => {
    const user = userEvent.setup();
    render(<MessageInput {...defaultProps} />);

    const textarea = screen.getByRole('textbox');
    const sendButton = screen.getByRole('button', { name: /send message/i });

    await user.type(textarea, 'Test message');
    await user.click(sendButton);

    expect(mockOnSendMessage).toHaveBeenCalledWith('Test message', undefined);
  });

  it('calls onSendMessage when Enter is pressed', async () => {
    const user = userEvent.setup();
    render(<MessageInput {...defaultProps} />);

    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'Test message');
    await user.keyboard('{Enter}');

    expect(mockOnSendMessage).toHaveBeenCalledWith('Test message', undefined);
  });

  it('does not send message when Shift+Enter is pressed', async () => {
    const user = userEvent.setup();
    render(<MessageInput {...defaultProps} />);

    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'Test message');
    await user.keyboard('{Shift>}{Enter}{/Shift}');

    expect(mockOnSendMessage).not.toHaveBeenCalled();
    expect(textarea).toHaveValue('Test message\n');
  });

  it('clears textarea after sending message', async () => {
    const user = userEvent.setup();
    render(<MessageInput {...defaultProps} />);

    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'Test message');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(textarea).toHaveValue('');
    });
  });

  it('disables send button when textarea is empty', () => {
    render(<MessageInput {...defaultProps} />);

    const sendButton = screen.getByRole('button', { name: /send message/i });
    expect(sendButton).toBeDisabled();
  });

  it('enables send button when textarea has content', async () => {
    const user = userEvent.setup();
    render(<MessageInput {...defaultProps} />);

    const textarea = screen.getByRole('textbox');
    const sendButton = screen.getByRole('button', { name: /send message/i });

    await user.type(textarea, 'Test');

    expect(sendButton).toBeEnabled();
  });

  it('calls typing handlers when typing', async () => {
    const user = userEvent.setup();
    render(<MessageInput {...defaultProps} />);

    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'T');

    expect(mockOnTypingStart).toHaveBeenCalled();
  });

  it('calls typing stop when textarea is cleared', async () => {
    const user = userEvent.setup();
    render(<MessageInput {...defaultProps} />);

    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'Test');
    await user.clear(textarea);

    expect(mockOnTypingStop).toHaveBeenCalled();
  });

  it('shows character count when near limit', async () => {
    const user = userEvent.setup();
    render(<MessageInput {...defaultProps} maxLength={10} />);

    const textarea = screen.getByRole('textbox');
    await user.type(textarea, '123456789'); // 9 characters, 90% of 10 - definitely over the limit

    // Character count should appear when near limit
    await waitFor(() => {
      expect(screen.getByText(/9\/10/)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('prevents typing when at character limit', async () => {
    const user = userEvent.setup();
    render(<MessageInput {...defaultProps} maxLength={5} />);

    const textarea = screen.getByRole('textbox');
    await user.type(textarea, '12345'); // At limit
    await user.type(textarea, '6'); // Should not be added

    expect(textarea).toHaveValue('12345');
  });

  it('handles emoji selection', async () => {
    const user = userEvent.setup();
    render(<MessageInput {...defaultProps} />);

    const emojiButton = screen.getByTestId('emoji-picker');

    // Click emoji picker without typing first (should add emoji at position 0)
    await user.click(emojiButton);

    // The emoji should be added to the empty textarea
    const textarea = screen.getByRole('textbox');
    await waitFor(() => {
      expect(textarea).toHaveValue('😀');
    });
  });

  it('handles file attachment', async () => {
    const user = userEvent.setup();
    render(<MessageInput {...defaultProps} />);

    const fileButton = screen.getByText('File Attachment');
    await user.click(fileButton);

    const sendButton = screen.getByRole('button', { name: /send message/i });
    expect(sendButton).toBeEnabled(); // Should be enabled with file attachment
  });

  it('sends message with files when files are attached', async () => {
    const user = userEvent.setup();
    render(<MessageInput {...defaultProps} />);

    const fileButton = screen.getByText('File Attachment');
    await user.click(fileButton);

    const sendButton = screen.getByRole('button', { name: /send message/i });
    await user.click(sendButton);

    expect(mockOnSendMessage).toHaveBeenCalledWith('', expect.any(Array));
  });

  it('respects disabled prop', () => {
    render(<MessageInput {...defaultProps} disabled={true} />);

    const textarea = screen.getByRole('textbox');
    const sendButton = screen.getByRole('button', { name: /send message/i });

    expect(textarea).toBeDisabled();
    expect(sendButton).toBeDisabled();
  });

  it('uses custom placeholder', () => {
    render(<MessageInput {...defaultProps} placeholder="Custom placeholder" />);

    const textarea = screen.getByPlaceholderText('Custom placeholder');
    expect(textarea).toBeInTheDocument();
  });

  it('shows loading state when sending', async () => {
    const user = userEvent.setup();
    render(<MessageInput {...defaultProps} />);

    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'Test message');

    const sendButton = screen.getByRole('button', { name: /send message/i });
    await user.click(sendButton);

    // Should show loading spinner briefly
    expect(sendButton).toBeDisabled();
  });

  it('does not send empty messages', async () => {
    const user = userEvent.setup();
    render(<MessageInput {...defaultProps} />);

    const textarea = screen.getByRole('textbox');
    await user.type(textarea, '   '); // Only whitespace
    await user.keyboard('{Enter}');

    expect(mockOnSendMessage).not.toHaveBeenCalled();
  });

  it('trims whitespace from messages', async () => {
    const user = userEvent.setup();
    render(<MessageInput {...defaultProps} />);

    const textarea = screen.getByRole('textbox');
    await user.type(textarea, '  Test message  ');
    await user.keyboard('{Enter}');

    expect(mockOnSendMessage).toHaveBeenCalledWith('Test message', undefined);
  });
});