// FRONTEND FILE
// Path: frontend/src/context/AdminAuthContext.jsx

import { createContext, useContext, useState, useEffect } from "react";

const AdminAuthContext = createContext(undefined);

export const AdminAuthProvider = ({ children }) => {
  const [adminToken, setAdminToken] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem("adminToken");
    if (stored) setAdminToken(stored);
  }, []);

  const loginAdmin = (token) => {
    localStorage.setItem("adminToken", token);
    setAdminToken(token);
  };

  const logoutAdmin = () => {
    localStorage.removeItem("adminToken");
    setAdminToken(null);
  };

  return (
    <AdminAuthContext.Provider value={{ adminToken, loginAdmin, logoutAdmin }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  return useContext(AdminAuthContext);
};
