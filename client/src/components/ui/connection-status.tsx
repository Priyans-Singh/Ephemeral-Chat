import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { Wifi, WifiOff, Loader2, AlertCircle } from 'lucide-react';
import { Badge } from './badge';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

type ConnectionState = 'connected' | 'connecting' | 'disconnected' | 'error';

interface ConnectionStatusProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const ConnectionStatus = ({ 
  className, 
  showText = true, 
  size = 'md' 
}: ConnectionStatusProps) => {
  const { socket } = useAuth();
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [lastConnectedTime, setLastConnectedTime] = useState<Date | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  useEffect(() => {
    if (socket) {
      const handleConnect = () => {
        setConnectionState('connected');
        setLastConnectedTime(new Date());
        setReconnectAttempts(0);
      };
      
      const handleDisconnect = (reason: string) => {
        setConnectionState('disconnected');
        console.log('Disconnected:', reason);
      };

      const handleConnecting = () => {
        setConnectionState('connecting');
      };

      const handleConnectionConfirmed = () => {
        setConnectionState('connected');
        setLastConnectedTime(new Date());
        setReconnectAttempts(0);
      };

      const handleConnectError = (error: any) => {
        setConnectionState('error');
        setReconnectAttempts(prev => prev + 1);
        console.error('Connection error:', error);
      };

      const handleReconnectAttempt = (attemptNumber: number) => {
        setConnectionState('connecting');
        setReconnectAttempts(attemptNumber);
      };

      // Set initial state
      setConnectionState(socket.connected ? 'connected' : 'disconnected');
      if (socket.connected) {
        setLastConnectedTime(new Date());
      }

      socket.on('connect', handleConnect);
      socket.on('disconnect', handleDisconnect);
      socket.on('connecting', handleConnecting);
      socket.on('connection_confirmed', handleConnectionConfirmed);
      socket.on('connect_error', handleConnectError);
      socket.on('reconnect_attempt', handleReconnectAttempt);

      return () => {
        socket.off('connect', handleConnect);
        socket.off('disconnect', handleDisconnect);
        socket.off('connecting', handleConnecting);
        socket.off('connection_confirmed', handleConnectionConfirmed);
        socket.off('connect_error', handleConnectError);
        socket.off('reconnect_attempt', handleReconnectAttempt);
      };
    } else {
      setConnectionState('disconnected');
    }
  }, [socket]);

  if (!socket) return null;

  const getStatusConfig = () => {
    switch (connectionState) {
      case 'connected':
        return {
          variant: 'default' as const,
          icon: Wifi,
          text: 'Connected',
          className: 'bg-green-500 text-white border-green-500 hover:bg-green-600',
          pulseColor: 'bg-green-400'
        };
      case 'connecting':
        return {
          variant: 'secondary' as const,
          icon: Loader2,
          text: reconnectAttempts > 0 ? `Reconnecting... (${reconnectAttempts})` : 'Connecting...',
          className: 'bg-yellow-500 text-white border-yellow-500 hover:bg-yellow-600',
          pulseColor: 'bg-yellow-400'
        };
      case 'error':
        return {
          variant: 'destructive' as const,
          icon: AlertCircle,
          text: 'Connection Error',
          className: 'bg-red-500 text-white border-red-500 hover:bg-red-600',
          pulseColor: 'bg-red-400'
        };
      case 'disconnected':
      default:
        return {
          variant: 'outline' as const,
          icon: WifiOff,
          text: 'Disconnected',
          className: 'bg-gray-500 text-white border-gray-500 hover:bg-gray-600',
          pulseColor: 'bg-gray-400'
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 [&>svg]:size-2.5',
    md: 'text-xs px-2.5 py-1 [&>svg]:size-3',
    lg: 'text-sm px-3 py-1.5 [&>svg]:size-4'
  };

  const getStatusMessage = () => {
    if (connectionState === 'connected' && lastConnectedTime) {
      const now = new Date();
      const diff = now.getTime() - lastConnectedTime.getTime();
      const minutes = Math.floor(diff / 60000);
      if (minutes < 1) return 'Just connected';
      if (minutes < 60) return `Connected ${minutes}m ago`;
      const hours = Math.floor(minutes / 60);
      return `Connected ${hours}h ago`;
    }
    return config.text;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={cn('relative', className)}
    >
      <Badge
        variant={config.variant}
        className={cn(
          'relative overflow-hidden transition-all duration-300 ease-in-out',
          config.className,
          sizeClasses[size],
          className
        )}
        title={getStatusMessage()}
      >
        {/* Pulse animation for connecting state */}
        <AnimatePresence>
          {connectionState === 'connecting' && (
            <motion.div
              initial={{ scale: 0, opacity: 0.8 }}
              animate={{ scale: 2, opacity: 0 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ 
                duration: 1.5, 
                repeat: Infinity, 
                ease: "easeOut" 
              }}
              className={cn(
                'absolute inset-0 rounded-full',
                config.pulseColor
              )}
            />
          )}
        </AnimatePresence>

        {/* Status icon with animation */}
        <motion.div
          key={connectionState}
          initial={{ rotate: -90, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Icon 
            className={cn(
              'transition-transform duration-200',
              connectionState === 'connecting' && 'animate-spin',
              connectionState === 'connected' && 'text-white',
            )} 
          />
        </motion.div>

        {/* Status text */}
        {showText && (
          <AnimatePresence mode="wait">
            <motion.span
              key={connectionState}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              className="font-medium"
            >
              {config.text}
            </motion.span>
          </AnimatePresence>
        )}

        {/* Connection quality indicator */}
        {connectionState === 'connected' && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, duration: 0.2 }}
            className="flex space-x-0.5 ml-1"
          >
            {[1, 2, 3].map((bar) => (
              <motion.div
                key={bar}
                initial={{ height: 0 }}
                animate={{ height: `${bar * 2 + 2}px` }}
                transition={{ delay: 0.1 * bar, duration: 0.2 }}
                className="w-0.5 bg-white/70 rounded-full"
              />
            ))}
          </motion.div>
        )}
      </Badge>

      {/* Offline indicator */}
      {connectionState === 'disconnected' && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-background"
        />
      )}
    </motion.div>
  );
};