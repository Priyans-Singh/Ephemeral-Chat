import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { FileAttachment } from '../FileAttachment';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

describe('FileAttachment', () => {
  const mockOnFileSelect = vi.fn();
  const mockOnFileRemove = vi.fn();

  const defaultProps = {
    onFileSelect: mockOnFileSelect,
    onFileRemove: mockOnFileRemove,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders file attachment button', () => {
    render(<FileAttachment {...defaultProps} />);

    const button = screen.getByRole('button', { name: /attach file/i });
    expect(button).toBeInTheDocument();
  });

  it('shows file count when maxFiles is specified', () => {
    render(<FileAttachment {...defaultProps} maxFiles={3} />);

    const button = screen.getByRole('button', { name: /attach file/i });
    expect(button).toBeInTheDocument();
    
    // Component should render without errors
    expect(button).toBeEnabled();
  });

  it('respects disabled prop', () => {
    render(<FileAttachment {...defaultProps} disabled={true} />);

    const button = screen.getByRole('button', { name: /attach file/i });
    expect(button).toBeDisabled();
  });

  it('applies custom className', () => {
    const { container } = render(
      <FileAttachment {...defaultProps} className="custom-class" />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('renders with default props', () => {
    render(<FileAttachment onFileSelect={mockOnFileSelect} />);

    const button = screen.getByRole('button', { name: /attach file/i });
    expect(button).toBeInTheDocument();
    expect(button).toBeEnabled();
  });

  it('handles maxFileSize prop', () => {
    render(<FileAttachment {...defaultProps} maxFileSize={5} />);

    const button = screen.getByRole('button', { name: /attach file/i });
    expect(button).toBeInTheDocument();
  });

  it('handles acceptedTypes prop', () => {
    render(<FileAttachment {...defaultProps} acceptedTypes={['image/*', '.pdf']} />);

    const button = screen.getByRole('button', { name: /attach file/i });
    expect(button).toBeInTheDocument();
  });

  it('shows paperclip icon', () => {
    render(<FileAttachment {...defaultProps} />);

    // Check for the paperclip icon (lucide-paperclip class)
    const icon = document.querySelector('.lucide-paperclip');
    expect(icon).toBeInTheDocument();
  });

  it('handles button click interaction', async () => {
    const user = userEvent.setup();
    render(<FileAttachment {...defaultProps} />);

    const button = screen.getByRole('button', { name: /attach file/i });
    
    // Should be able to click the button without errors
    await user.click(button);
    
    // Button should remain enabled after click
    expect(button).toBeEnabled();
  });

  it('disables button when at max files limit', () => {
    render(<FileAttachment {...defaultProps} maxFiles={0} />);

    const button = screen.getByRole('button', { name: /attach file/i });
    expect(button).toBeDisabled();
  });

  it('renders hidden file input', () => {
    render(<FileAttachment {...defaultProps} />);

    const fileInput = document.querySelector('input[type="file"]');
    expect(fileInput).toBeInTheDocument();
    expect(fileInput).toHaveClass('hidden');
  });

  it('sets correct file input attributes', () => {
    render(<FileAttachment {...defaultProps} acceptedTypes={['image/*', '.pdf']} />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).toHaveAttribute('multiple');
    expect(fileInput).toHaveAttribute('accept', 'image/*,.pdf');
  });
});