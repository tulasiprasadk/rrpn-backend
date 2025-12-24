import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Usage: wrap routes: <Route element={<ProtectedRoute><Page/></ProtectedRoute>} />
export default function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
}
