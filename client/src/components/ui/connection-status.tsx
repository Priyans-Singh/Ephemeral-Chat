import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { Wifi, WifiOff, Loader2 } from 'lucide-react';

export const ConnectionStatus = () => {
  const { socket } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    if (socket) {
      const handleConnect = () => {
        setIsConnected(true);
        setIsConnecting(false);
      };
      
      const handleDisconnect = () => {
        setIsConnected(false);
        setIsConnecting(false);
      };

      const handleConnecting = () => {
        setIsConnecting(true);
        setIsConnected(false);
      };

      const handleConnectionConfirmed = () => {
        setIsConnected(true);
        setIsConnecting(false);
      };

      // Set initial state
      setIsConnected(socket.connected);
      setIsConnecting(!socket.connected);

      socket.on('connect', handleConnect);
      socket.on('disconnect', handleDisconnect);
      socket.on('connecting', handleConnecting);
      socket.on('connection_confirmed', handleConnectionConfirmed);

      return () => {
        socket.off('connect', handleConnect);
        socket.off('disconnect', handleDisconnect);
        socket.off('connecting', handleConnecting);
        socket.off('connection_confirmed', handleConnectionConfirmed);
      };
    } else {
      setIsConnected(false);
      setIsConnecting(false);
    }
  }, [socket]);

  if (!socket) return null;

  return (
    <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs transition-colors ${
      isConnected 
        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
        : isConnecting
        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    }`}>
      {isConnected ? (
        <>
          <Wifi className="h-3 w-3" />
          <span>Connected</span>
        </>
      ) : isConnecting ? (
        <>
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>Connecting...</span>
        </>
      ) : (
        <>
          <WifiOff className="h-3 w-3" />
          <span>Disconnected</span>
        </>
      )}
    </div>
  );
};