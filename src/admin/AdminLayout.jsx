import { Outlet, Navigate } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext";
import AdminSidebar from "./components/AdminSidebar";

const AdminLayout = () => {
  const { adminToken, loading } = useAdminAuth();

  if (loading) return <div>Loading...</div>;
  if (!adminToken) return <Navigate to="/admin/login" replace />;

  return (
    <div className="flex">
      <AdminSidebar />
      <div className="flex-1 p-6 bg-gray-50 min-h-screen">
        <Outlet />
      </div>
    </div>
  );
};

export default AdminLayout;
