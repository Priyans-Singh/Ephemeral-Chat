import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from './LoadingSpinner';

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { token, user, isLoading } = useAuth();
  const location = useLocation();

  console.log('ProtectedRoute check:', { token: !!token, user: !!user, isLoading, path: location.pathname });

  // Show loading spinner while validating authentication
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Check both token and user to ensure complete authentication
  if (!token || !user) {
    console.log('Redirecting to login - missing token or user');
    // Save the attempted location for redirect after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  console.log('Access granted to protected route');
  // If there is a token and user, render the child components (the protected page)
  return <>{children}</>;
};