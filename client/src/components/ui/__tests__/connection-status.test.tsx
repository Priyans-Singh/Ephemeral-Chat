import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConnectionStatus } from '../connection-status';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

// Mock the useAuth hook
const mockSocket = {
  connected: false,
  on: vi.fn(),
  off: vi.fn(),
};

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    socket: mockSocket,
  }),
}));

describe('ConnectionStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSocket.connected = false;
  });

  it('should render null when no socket is available', () => {
    vi.mocked(require('@/contexts/AuthContext').useAuth).mockReturnValue({
      socket: null,
    });

    const { container } = render(<ConnectionStatus />);
    expect(container.firstChild).toBeNull();
  });

  it('should render disconnected state initially', () => {
    render(<ConnectionStatus />);
    
    expect(screen.getByText('Disconnected')).toBeInTheDocument();
    expect(document.querySelector('.lucide-wifi-off')).toBeInTheDocument();
  });

  it('should register socket event listeners', () => {
    render(<ConnectionStatus />);
    
    expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('connecting', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('connection_confirmed', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('connect_error', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('reconnect_attempt', expect.any(Function));
  });

  it('should show connected state when socket is connected', () => {
    mockSocket.connected = true;
    
    render(<ConnectionStatus />);
    
    // Simulate connect event
    const connectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect')?.[1];
    if (connectHandler) {
      connectHandler();
    }

    waitFor(() => {
      expect(screen.getByText('Connected')).toBeInTheDocument();
      expect(document.querySelector('.lucide-wifi')).toBeInTheDocument();
    });
  });

  it('should show connecting state', () => {
    render(<ConnectionStatus />);
    
    // Simulate connecting event
    const connectingHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connecting')?.[1];
    if (connectingHandler) {
      connectingHandler();
    }

    waitFor(() => {
      expect(screen.getByText('Connecting...')).toBeInTheDocument();
      expect(document.querySelector('.lucide-loader-2')).toBeInTheDocument();
    });
  });

  it('should show error state on connection error', () => {
    render(<ConnectionStatus />);
    
    // Simulate connect_error event
    const errorHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect_error')?.[1];
    if (errorHandler) {
      errorHandler(new Error('Connection failed'));
    }

    waitFor(() => {
      expect(screen.getByText('Connection Error')).toBeInTheDocument();
      expect(document.querySelector('.lucide-alert-circle')).toBeInTheDocument();
    });
  });

  it('should clean up event listeners on unmount', () => {
    const { unmount } = render(<ConnectionStatus />);
    
    unmount();
    
    expect(mockSocket.off).toHaveBeenCalledWith('connect', expect.any(Function));
    expect(mockSocket.off).toHaveBeenCalledWith('disconnect', expect.any(Function));
    expect(mockSocket.off).toHaveBeenCalledWith('connecting', expect.any(Function));
    expect(mockSocket.off).toHaveBeenCalledWith('connection_confirmed', expect.any(Function));
    expect(mockSocket.off).toHaveBeenCalledWith('connect_error', expect.any(Function));
    expect(mockSocket.off).toHaveBeenCalledWith('reconnect_attempt', expect.any(Function));
  });

  it('should render without text when showText is false', () => {
    render(<ConnectionStatus showText={false} />);
    
    expect(screen.queryByText('Disconnected')).not.toBeInTheDocument();
    expect(document.querySelector('.lucide-wifi-off')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(<ConnectionStatus className="custom-class" />);
    
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('should show reconnection attempts in connecting state', () => {
    render(<ConnectionStatus />);
    
    // Simulate reconnect_attempt event
    const reconnectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'reconnect_attempt')?.[1];
    if (reconnectHandler) {
      reconnectHandler(3);
    }

    waitFor(() => {
      expect(screen.getByText('Reconnecting... (3)')).toBeInTheDocument();
    });
  });
});