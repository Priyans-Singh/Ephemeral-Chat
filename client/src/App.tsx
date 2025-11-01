import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ChatPage } from './pages/ChatPage';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { PublicRoute } from './components/layout/PublicRoute';
import { Toaster } from '@/components/ui/sonner';
import { useTheme } from '@/contexts/ThemeContext';
import { useEffect } from 'react';

function App() {
  const { themeConfig } = useTheme();

  // Apply global animation preferences
  useEffect(() => {
    const root = document.documentElement;
    
    // Apply reduced motion preference
    if (themeConfig.reducedMotion || !themeConfig.animations) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }

    // Apply performance mode classes
    if (themeConfig.performanceMode === 'high') {
      root.classList.add('gpu-accelerated');
    } else {
      root.classList.remove('gpu-accelerated');
    }
  }, [themeConfig]);

  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          } 
        />
        <Route 
          path="/register" 
          element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          } 
        />
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          }
        />
        {/* Catch all route - redirect to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
      <Toaster 
        position="top-right"
        expand={true}
        richColors={true}
        closeButton={true}
      />
    </>
  );
}

export default App;