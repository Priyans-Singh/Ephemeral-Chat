import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';

export const ChatPage = () => {
  const { socket, logout } = useAuth();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (socket) {
      // Listen for the 'connect' event
      socket.on('connect', () => {
        setIsConnected(true);
        console.log('Socket connected!', socket.id);
      });

      // Listen for the 'disconnect' event
      socket.on('disconnect', () => {
        setIsConnected(false);
        console.log('Socket disconnected!');
      });

      // Clean up listeners when the component unmounts
      return () => {
        socket.off('connect');
        socket.off('disconnect');
      };
    }
  }, [socket]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-4">
      <h1 className="text-3xl font-bold">Welcome to the Chat!</h1>
      <p className="text-lg">
        Socket Status:
        <span className={isConnected ? 'text-green-500' : 'text-red-500'}>
          {isConnected ? ' Connected' : ' Disconnected'}
        </span>
      </p>
      <button
        onClick={logout}
        className="rounded bg-indigo-600 px-4 py-2 text-white"
      >
        Logout
      </button>
    </div>
  );
};