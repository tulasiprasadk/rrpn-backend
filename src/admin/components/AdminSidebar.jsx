import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAdminAuth } from "../../context/AdminAuthContext";
import AnalyticsWidget from "./AnalyticsWidget";

const AdminSidebar = () => {
  const { logoutAdmin } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) =>
    location.pathname.startsWith(path)
      ? "bg-gray-700 text-white"
      : "text-gray-300 hover:bg-gray-700 hover:text-white";

  const handleLogout = () => {
    logoutAdmin();
    navigate("/admin/login");
  };

  return (
    <aside className="w-64 bg-gray-800 text-white min-h-screen p-5 flex flex-col justify-between">
      <div>
        <h2 className="text-xl font-bold mb-6">Admin Panel</h2>

        <nav className="space-y-2">
          <Link to="/admin" className={`block px-4 py-2 rounded ${isActive("/admin")}`}>
            📊 Dashboard
          </Link>

          <Link
            to="/admin/suppliers"
            className={`block px-4 py-2 rounded ${isActive("/admin/suppliers")}`}
          >
            🧑‍🏭 Suppliers
          </Link>

          <Link
            to="/admin/ads"
            className={`block px-4 py-2 rounded ${isActive("/admin/ads")}`}
          >
            📰 Advertisements
          </Link>

          <Link
            to="/admin/products"
            className={`block px-4 py-2 rounded ${isActive("/admin/products")}`}
          >
            🛒 Products
          </Link>

          <Link
            to="/admin/analytics"
            className={`block px-4 py-2 rounded ${isActive("/admin/analytics")}`}
          >
            📈 Analytics
          </Link>
        </nav>

        <AnalyticsWidget />
      </div>

<Link
  to="/admin/categories"
  className={`block px-4 py-2 rounded ${isActive("/admin/categories")}`}
>
  🗂 Categories
</Link>

<Link
  to="/admin/orders"
  className={`block px-4 py-2 rounded ${isActive("/admin/orders")}`}
>
  📦 Orders
</Link>


      <button
        onClick={handleLogout}
        className="mt-6 w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded"
      >
        Logout
      </button>
    </aside>
  );
};

export default AdminSidebar;
