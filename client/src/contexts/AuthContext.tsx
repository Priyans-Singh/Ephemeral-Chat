import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
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

  const logout = useCallback(() => {
    console.log('Logging out user');
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    // Socket cleanup will be handled by the useEffect cleanup
  }, []);

  useEffect(() => {
    let currentSocket: Socket | null = null;

    if (token) {
      console.log('Token found, initializing connection...');

      // Fetch full user profile first
      const fetchUserProfile = async () => {
        try {
          const response = await apiClient.get('/auth/profile');
          setUser(response.data);
          return response.data;
        } catch (error) {
          console.error('Failed to fetch user profile:', error);
          // Fallback to JWT decode
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const fallbackUser = { id: payload.sub };
            setUser(fallbackUser);
            return fallbackUser;
          } catch (decodeError) {
            console.error('Failed to decode JWT:', decodeError);
            setUser(null);
            setToken(null);
            localStorage.removeItem('token');
            return null;
          }
        }
      };

      // Initialize socket connection
      const initializeSocket = async () => {
        const userData = await fetchUserProfile();
        if (!userData) return;

        // Clean up any existing socket first
        if (currentSocket) {
          console.log('🧹 Cleaning up existing socket before creating new one');
          currentSocket.removeAllListeners();
          currentSocket.disconnect();
          currentSocket = null;
        }

        console.log('🔌 Creating socket connection for user:', userData.displayName || userData.id);

        // Create new socket instance
        currentSocket = io('http://localhost:3000', {
          auth: {
            token: `Bearer ${token}`,
          },
          autoConnect: true,
          reconnection: true,
          reconnectionAttempts: 3,
          reconnectionDelay: 2000,
          timeout: 5000,
          forceNew: true, // Force a new connection
        });

        // Set up event handlers
        currentSocket.on('connect', () => {
          console.log('✅ Socket connected:', currentSocket?.id);
        });

        currentSocket.on('connection_confirmed', (data) => {
          console.log('✅ Connection confirmed:', data);
          toast.success('Connected to chat server');
        });

        currentSocket.on('auth_error', (error) => {
          console.error('❌ Auth error:', error);
          toast.error(`Connection failed: ${error.message}`);

          if (error.code === 'TOKEN_EXPIRED' || error.code === 'INVALID_TOKEN') {
            logout();
          }
        });

        currentSocket.on('connect_error', (error) => {
          console.error('❌ Connection error:', error);
        });

        currentSocket.on('disconnect', (reason) => {
          console.log('🔌 Socket disconnected:', reason);
          if (reason === 'io server disconnect') {
            toast.error('Disconnected from server');
          }
        });

        currentSocket.on('reconnect', (attemptNumber) => {
          console.log('🔄 Reconnected after', attemptNumber, 'attempts');
          toast.success('Reconnected to server');
        });

        currentSocket.on('reconnect_failed', () => {
          console.error('❌ Reconnection failed');
          toast.error('Failed to reconnect');
        });

        // Update socket state
        setSocket(currentSocket);
      };

      // Start initialization
      initializeSocket().catch(console.error);
    } else {
      console.log('No token, clearing user and socket');
      setUser(null);
      setSocket(null);
    }

    // Cleanup function
    return () => {
      if (currentSocket) {
        console.log('🧹 Cleaning up socket connection');
        currentSocket.removeAllListeners();
        currentSocket.disconnect();
        currentSocket = null;
      }
      setSocket(null);
    };
  }, [token, logout]);

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