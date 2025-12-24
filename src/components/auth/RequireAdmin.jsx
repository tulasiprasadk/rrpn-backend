// FRONTEND FILE
// Path: frontend/src/components/auth/RequireAdmin.jsx

import { Navigate, Outlet } from "react-router-dom";
import { useAdminAuth } from "../../context/AdminAuthContext";
import { useEffect, useState } from "react";

const RequireAdmin = () => {
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if admin is logged in via session
    fetch("/api/admin/me", { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        setIsAuthenticated(data.loggedIn);
        setIsChecking(false);
      })
      .catch(() => {
        setIsAuthenticated(false);
        setIsChecking(false);
      });
  }, []);

  if (isChecking) {
    return <div style={{ padding: 24 }}>Checking authentication...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return <Outlet />;
};

export default RequireAdmin;
