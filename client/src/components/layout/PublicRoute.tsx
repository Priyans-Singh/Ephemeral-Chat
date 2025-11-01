import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from './LoadingSpinner';

export const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { token, user, isLoading } = useAuth();
  const location = useLocation();

  console.log('PublicRoute check:', { token: !!token, user: !!user, isLoading, path: location.pathname });

  // Show loading spinner while validating authentication
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // If user is already authenticated, redirect to chat
  if (token && user) {
    console.log('User already authenticated, redirecting to chat');
    // Check if there's a saved location to redirect to
    const from = location.state?.from?.pathname || '/chat';
    return <Navigate to={from} replace />;
  }

  console.log('Access granted to public route');
  // If not authenticated, render the public page (login/register)
  return <>{children}</>;
};