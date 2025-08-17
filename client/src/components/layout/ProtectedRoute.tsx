import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { token } = useAuth();

  if (!token) {
    // If there's no token, redirect the user to the login page
    return <Navigate to="/login" />;
  }

  // If there is a token, render the child components (the protected page)
  return <>{children}</>;
};