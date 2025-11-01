import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { MessageStatus } from '../MessageStatus';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

describe('MessageStatus', () => {
  it('renders sending status with loading icon', () => {
    render(<MessageStatus status="sending" />);
    
    // Should show loading spinner (SVG with animate-spin class)
    const container = document.querySelector('.animate-spin');
    expect(container).toBeInTheDocument();
  });

  it('renders sent status with check icon', () => {
    render(<MessageStatus status="sent" />);
    
    // Should show check icon (SVG with lucide-check class)
    const container = document.querySelector('.lucide-check');
    expect(container).toBeInTheDocument();
  });

  it('renders delivered status with double check icon', () => {
    render(<MessageStatus status="delivered" />);
    
    // Should show double check icon (SVG with lucide-check-check class)
    const container = document.querySelector('.lucide-check-check');
    expect(container).toBeInTheDocument();
  });

  it('renders read status with blue double check icon', () => {
    render(<MessageStatus status="read" />);
    
    // Should show blue double check icon
    const container = document.querySelector('.lucide-check-check');
    expect(container).toBeInTheDocument();
    
    const statusContainer = container?.closest('.text-blue-500');
    expect(statusContainer).toBeInTheDocument();
  });

  it('renders error status with alert icon', () => {
    render(<MessageStatus status="error" />);
    
    // Should show alert icon with red color
    const container = document.querySelector('.lucide-circle-alert');
    expect(container).toBeInTheDocument();
    
    const statusContainer = container?.closest('.text-red-500');
    expect(statusContainer).toBeInTheDocument();
  });

  it('shows status text when showText is true', () => {
    render(<MessageStatus status="sending" showText={true} />);
    
    expect(screen.getByText('Sending...')).toBeInTheDocument();
  });

  it('shows sent status text', () => {
    render(<MessageStatus status="sent" showText={true} />);
    
    expect(screen.getByText('Sent')).toBeInTheDocument();
  });

  it('shows delivered status text', () => {
    render(<MessageStatus status="delivered" showText={true} />);
    
    expect(screen.getByText('Delivered')).toBeInTheDocument();
  });

  it('shows read status text', () => {
    render(<MessageStatus status="read" showText={true} />);
    
    expect(screen.getByText('Read')).toBeInTheDocument();
  });

  it('shows error status text', () => {
    render(<MessageStatus status="error" showText={true} />);
    
    expect(screen.getByText('Failed to send')).toBeInTheDocument();
  });

  it('displays timestamp when provided and showText is false', () => {
    const timestamp = new Date('2024-01-01T12:30:00Z');
    render(<MessageStatus status="sent" timestamp={timestamp} />);
    
    // Should show formatted time (format may vary by locale)
    expect(screen.getByText(/pm/i)).toBeInTheDocument();
  });

  it('does not display timestamp when showText is true', () => {
    const timestamp = new Date('2024-01-01T12:30:00Z');
    render(<MessageStatus status="sent" timestamp={timestamp} showText={true} />);
    
    expect(screen.queryByText('12:30')).not.toBeInTheDocument();
    expect(screen.getByText('Sent')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <MessageStatus status="sent" className="custom-class" />
    );
    
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('applies correct color classes for different statuses', () => {
    const { rerender } = render(<MessageStatus status="sending" />);
    let container = document.querySelector('.text-muted-foreground');
    expect(container).toBeInTheDocument();

    rerender(<MessageStatus status="read" />);
    container = document.querySelector('.text-blue-500');
    expect(container).toBeInTheDocument();

    rerender(<MessageStatus status="error" />);
    container = document.querySelector('.text-red-500');
    expect(container).toBeInTheDocument();
  });

  it('formats timestamp correctly for different times', () => {
    const morningTime = new Date('2024-01-01T09:15:00Z');
    const { rerender } = render(<MessageStatus status="sent" timestamp={morningTime} />);
    // Just check that a time is displayed, regardless of AM/PM due to timezone differences
    expect(screen.getByText(/\d{1,2}:\d{2}/)).toBeInTheDocument();

    const afternoonTime = new Date('2024-01-01T15:45:00Z');
    rerender(<MessageStatus status="sent" timestamp={afternoonTime} />);
    expect(screen.getByText(/\d{1,2}:\d{2}/)).toBeInTheDocument();
  });

  it('handles edge case with no timestamp', () => {
    render(<MessageStatus status="sent" />);
    
    // Should only show the icon, no timestamp text
    const icon = document.querySelector('.lucide-check');
    expect(icon).toBeInTheDocument();
    
    // Should not have any time-related text
    expect(screen.queryByText(/am|pm/i)).not.toBeInTheDocument();
  });
});