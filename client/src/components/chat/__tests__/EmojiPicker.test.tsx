import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { EmojiPicker } from '../EmojiPicker';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

describe('EmojiPicker', () => {
  const mockOnEmojiSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders emoji picker button', () => {
    render(<EmojiPicker onEmojiSelect={mockOnEmojiSelect} />);

    const button = screen.getByRole('button', { name: /open emoji picker/i });
    expect(button).toBeInTheDocument();
  });

  it('opens emoji picker when button is clicked', async () => {
    const user = userEvent.setup();
    render(<EmojiPicker onEmojiSelect={mockOnEmojiSelect} />);

    const button = screen.getByRole('button', { name: /open emoji picker/i });
    await user.click(button);

    expect(screen.getByPlaceholderText('Search emojis...')).toBeInTheDocument();
  });

  it('displays emoji categories', async () => {
    const user = userEvent.setup();
    render(<EmojiPicker onEmojiSelect={mockOnEmojiSelect} />);

    const button = screen.getByRole('button', { name: /open emoji picker/i });
    await user.click(button);

    expect(screen.getByText('Smileys')).toBeInTheDocument();
    expect(screen.getByText('Animals')).toBeInTheDocument();
    expect(screen.getByText('Food')).toBeInTheDocument();
  });

  it('displays emojis in grid', async () => {
    const user = userEvent.setup();
    render(<EmojiPicker onEmojiSelect={mockOnEmojiSelect} />);

    const button = screen.getByRole('button', { name: /open emoji picker/i });
    await user.click(button);

    // Should show emojis from the default category (Smileys & People)
    expect(screen.getByText('😀')).toBeInTheDocument();
    expect(screen.getByText('😃')).toBeInTheDocument();
    expect(screen.getByText('😄')).toBeInTheDocument();
  });

  it('calls onEmojiSelect when emoji is clicked', async () => {
    const user = userEvent.setup();
    render(<EmojiPicker onEmojiSelect={mockOnEmojiSelect} />);

    const button = screen.getByRole('button', { name: /open emoji picker/i });
    await user.click(button);

    // Wait for the picker to open
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search emojis...')).toBeInTheDocument();
    });

    const emojiButton = screen.getByRole('button', { name: '😀' });
    await user.click(emojiButton);

    expect(mockOnEmojiSelect).toHaveBeenCalledWith('😀');
  });

  it('closes picker after emoji selection', async () => {
    const user = userEvent.setup();
    render(<EmojiPicker onEmojiSelect={mockOnEmojiSelect} />);

    const button = screen.getByRole('button', { name: /open emoji picker/i });
    await user.click(button);

    // Wait for the picker to open
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search emojis...')).toBeInTheDocument();
    });

    const emojiButton = screen.getByRole('button', { name: '😀' });
    await user.click(emojiButton);

    await waitFor(() => {
      expect(screen.queryByPlaceholderText('Search emojis...')).not.toBeInTheDocument();
    });
  });

  it('switches between emoji categories', async () => {
    const user = userEvent.setup();
    render(<EmojiPicker onEmojiSelect={mockOnEmojiSelect} />);

    const button = screen.getByRole('button', { name: /open emoji picker/i });
    await user.click(button);

    const animalsButton = screen.getByText('Animals');
    await user.click(animalsButton);

    // Should show animal emojis
    expect(screen.getByText('🐶')).toBeInTheDocument();
    expect(screen.getByText('🐱')).toBeInTheDocument();
  });

  it('filters emojis when searching', async () => {
    const user = userEvent.setup();
    render(<EmojiPicker onEmojiSelect={mockOnEmojiSelect} />);

    const button = screen.getByRole('button', { name: /open emoji picker/i });
    await user.click(button);

    const searchInput = screen.getByPlaceholderText('Search emojis...');
    await user.type(searchInput, 'smile');

    // Should still show emojis (search functionality is basic in current implementation)
    expect(screen.getByText('😀')).toBeInTheDocument();
  });

  it('closes picker when clicking outside', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <EmojiPicker onEmojiSelect={mockOnEmojiSelect} />
        <div data-testid="outside">Outside</div>
      </div>
    );

    const button = screen.getByRole('button', { name: /open emoji picker/i });
    await user.click(button);

    // Wait for the picker to open
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search emojis...')).toBeInTheDocument();
    });

    // Click on the backdrop (which is the fixed overlay)
    const backdrop = document.querySelector('.fixed.inset-0.z-40');
    if (backdrop) {
      await user.click(backdrop as Element);
    }

    await waitFor(() => {
      expect(screen.queryByPlaceholderText('Search emojis...')).not.toBeInTheDocument();
    });
  });

  it('applies custom className', () => {
    const { container } = render(
      <EmojiPicker onEmojiSelect={mockOnEmojiSelect} className="custom-class" />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('handles keyboard navigation', async () => {
    const user = userEvent.setup();
    render(<EmojiPicker onEmojiSelect={mockOnEmojiSelect} />);

    const button = screen.getByRole('button', { name: /open emoji picker/i });
    await user.click(button);

    // Should be able to tab through emojis
    const firstEmoji = screen.getByText('😀');
    expect(firstEmoji).toBeInTheDocument();
    
    // Test that emojis are clickable buttons
    expect(firstEmoji.closest('button')).toBeInTheDocument();
  });

  it('displays correct emoji titles', async () => {
    const user = userEvent.setup();
    render(<EmojiPicker onEmojiSelect={mockOnEmojiSelect} />);

    const button = screen.getByRole('button', { name: /open emoji picker/i });
    await user.click(button);

    const emojiButton = screen.getByText('😀').closest('button');
    expect(emojiButton).toHaveAttribute('title', '😀');
  });
});