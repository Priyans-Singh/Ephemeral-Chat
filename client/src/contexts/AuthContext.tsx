import React, { createContext, useState, useContext, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';

interface AuthContextType {
  token: string | null;
  user: any;
  socket: Socket | null; // Add socket to our context
  login: (data: any) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = useState<any>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (token) {
      // If a token exists, establish a WebSocket connection
      const newSocket = io('http://localhost:3000', {
        auth: {
          token: `Bearer ${token}`, // Send the token for authentication
        },
      });

      setSocket(newSocket);

      // Clean up the connection when the component unmounts or token changes
      return () => {
        newSocket.disconnect();
      };
    }
  }, [token]);

   const login = async (data: any) => {
    try {
      const response = await apiClient.post('/auth/login', data);
      const { access_token } = response.data;
      setToken(access_token);
      localStorage.setItem('token', access_token);
    } catch (error: any) {
      // Show an error toast
      toast.error(error.response?.data?.message || 'Failed to login. Please check your credentials.');
      throw error; // Re-throw the error so the component knows it failed
    }
  };

  const register = async (data: any) => {
    try {
      await apiClient.post('/auth/register', data);
      await login({ email: data.email, password: data.password });
    } catch (error: any) {
      // Show an error toast
      toast.error(error.response?.data?.message || 'Failed to register. Please try again.');
      throw error; // Re-throw the error
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    if (socket) {
      socket.disconnect(); // Disconnect the socket on logout
    }
  };

  return (
    <AuthContext.Provider value={{ token, user, socket, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};