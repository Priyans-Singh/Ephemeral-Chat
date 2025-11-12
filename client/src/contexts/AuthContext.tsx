import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import { apiClient } from '@/lib/api';
import { io, Socket } from 'socket.io-client';
import { notificationService } from '@/lib/notification-service';
import { tabSession } from '@/lib/tab-session';

interface AuthContextType {
  token: string | null;
  user: any;
  socket: Socket | null; // Add socket to our context
  isLoading: boolean; // Add loading state
  login: (data: any) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | null>(() => {
    const storedToken = tabSession.getToken();
    console.log('Initial token from localStorage:', !!storedToken);
    return storedToken;
  });
  const [user, setUser] = useState<any>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Start with loading true
  // Track connection attempts to dedupe events across StrictMode/reconnects
  const latestAttemptRef = useRef(0);
  const connectedAttemptRef = useRef<number | null>(null);

  const logout = useCallback(() => {
    console.log('Logging out user');

    // Clean up socket first
    if (socket) {
      socket.removeAllListeners();
      socket.disconnect();
    }

    setSocket(null);
    setToken(null);
    setUser(null);
    tabSession.setToken(null);
  }, [socket]);

  useEffect(() => {
    let currentSocket: Socket | null = null;
    // Bump attempt for each initialization caused by token change/mount
    const attemptId = ++latestAttemptRef.current;

    if (token) {
      console.log('Token found, initializing connection...');

      // Validate token and fetch user profile
      const fetchUserProfile = async () => {
        try {
          console.log('Validating token and fetching user profile...');
          const response = await apiClient.get('/auth/profile');
          console.log('User profile fetched successfully:', response.data);
          setUser(response.data);
          return response.data;
        } catch (error: any) {
          console.error('Failed to fetch user profile:', error);

          // If token is invalid/expired, clear it
          if (error.response?.status === 401 || error.response?.status === 403) {
            console.log('Token is invalid/expired, clearing auth state');
            setUser(null);
            setToken(null);
            tabSession.setToken(null);
            return null;
          }

          // Fallback to JWT decode for network errors
          try {
            console.log('Attempting JWT decode fallback...');
            const payload = JSON.parse(atob(token.split('.')[1]));

            // Check if token is expired
            const currentTime = Date.now() / 1000;
            if (payload.exp && payload.exp < currentTime) {
              console.log('Token is expired, clearing auth state');
              setUser(null);
              setToken(null);
              tabSession.setToken(null);
              return null;
            }

            const fallbackUser = { id: payload.sub, displayName: payload.displayName || 'User' };
            console.log('Using fallback user from JWT:', fallbackUser);
            setUser(fallbackUser);
            return fallbackUser;
          } catch (decodeError) {
            console.error('Failed to decode JWT:', decodeError);
            setUser(null);
            setToken(null);
            tabSession.setToken(null);
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
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          timeout: 10000,
          forceNew: true, // Force a new connection
          transports: ['websocket'], // Use websocket only for better reliability
        });

        // Set up event handlers
        currentSocket.on('connect', () => {
          console.log('✅ Socket connected:', currentSocket?.id);
        });

        currentSocket.on('connection_confirmed', (data) => {
          console.log('✅ Connection confirmed:', data);
          notificationService.connectionEstablished();
          // Set socket state only after authentication is confirmed
          setSocket(currentSocket);
        });

        currentSocket.on('auth_error', (error) => {
          console.error('❌ Auth error:', error);
          notificationService.error(`Connection failed: ${error.message}`);

          // Clear socket state on auth error
          setSocket(null);

          if (error.code === 'TOKEN_EXPIRED' || error.code === 'INVALID_TOKEN') {
            logout();
          }
        });

        currentSocket.on('connect_error', (error) => {
          console.error('❌ Connection error:', error);
        });

        currentSocket.on('disconnect', (reason) => {
          console.log('🔌 Socket disconnected:', reason);
          // Clear socket state on disconnect
          setSocket(null);

          if (reason === 'io server disconnect') {
            notificationService.connectionLost();
          } else if (reason === 'transport close' || reason === 'transport error') {
            console.log('🔄 Connection lost, will attempt to reconnect...');
          }
        });

        currentSocket.on('reconnect', (attemptNumber) => {
          console.log('🔄 Reconnected after', attemptNumber, 'attempts');
          notificationService.reconnected();
          // Socket state will be set when connection_confirmed is received
        });

        currentSocket.on('reconnect_failed', () => {
          console.error('❌ Reconnection failed');
          notificationService.error('Failed to reconnect');
        });

        // Socket state will be set in the connect handler
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
  }, [token]); // Remove logout from dependencies to prevent unnecessary re-runs

  // Initial token validation on app startup
  useEffect(() => {
    const validateInitialToken = async () => {
      const storedToken = tabSession.getToken();
      if (storedToken && !user) {
        console.log('Found stored token, validating...');
        try {
          const response = await apiClient.get('/auth/profile');
          console.log('Token is valid, user:', response.data);
          setUser(response.data);
        } catch (error: any) {
          console.log('Stored token is invalid, clearing...');
          tabSession.setToken(null);
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false); // Always set loading to false after validation
    };

    validateInitialToken();
  }, []); // Run only once on mount

  const login = async (data: any) => {
    try {
      const response = await apiClient.post('/auth/login', data);
      const { access_token } = response.data;
      setToken(access_token);
      tabSession.setToken(access_token);
    } catch (error: any) {
      // Show an error notification
      notificationService.loginError(error.response?.data?.message || 'Failed to login. Please check your credentials.');
      throw error; // Re-throw the error so the component knows it failed
    }
  };

  const register = async (data: any) => {
    try {
      await apiClient.post('/auth/register', data);
      await login({ email: data.email, password: data.password });
    } catch (error: any) {
      // Show an error notification
      notificationService.signupError(error.response?.data?.message || 'Failed to register. Please try again.');
      throw error; // Re-throw the error
    }
  };

  return (
    <AuthContext.Provider value={{ token, user, socket, isLoading, login, register, logout }}>
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
