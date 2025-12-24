import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function AdminOrdersList() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [status, setStatus] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [suppliers, setSuppliers] = useState([]);

  useEffect(() => {
    loadSuppliers();
    loadOrders();
  }, []);

  async function loadSuppliers() {
    try {
      const res = await axios.get("/api/admin/suppliers", { withCredentials: true });
      setSuppliers(res.data.data || res.data || []);
    } catch (err) {
      console.error("Failed to load suppliers", err);
    }
  }

  async function loadOrders() {
    setLoading(true);

    try {
      const res = await axios.get("/api/admin/orders", {
        params: {
          status,
          supplierId,
          date_from: dateFrom,
          date_to: dateTo,
        },
        withCredentials: true,
      });

      // API returns an array; fall back to res.data.orders if present
      const payload = Array.isArray(res.data) ? res.data : res.data?.orders || [];
      setOrders(payload);
    } catch (err) {
      console.error("Failed to load orders", err);
    }

    setLoading(false);
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-semibold mb-4">Orders</h1>

      {/* FILTER BAR */}
      <div className="admin-card p-4 mb-4 grid grid-cols-1 md:grid-cols-4 gap-3">
        <div>
          <label className="block text-sm">Status</label>
          <select
            className="admin-input"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">All</option>
            <option value="created">Created</option>
            <option value="paid">Paid</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div>
          <label className="block text-sm">Supplier</label>
          <select
            className="admin-input"
            value={supplierId}
            onChange={(e) => setSupplierId(e.target.value)}
          >
            <option value="">All Suppliers</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm">Date From</label>
          <input
            type="date"
            className="admin-input"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm">Date To</label>
          <input
            type="date"
            className="admin-input"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>

        <div className="col-span-full">
          <button className="admin-button primary" onClick={loadOrders}>
            Apply Filters
          </button>
        </div>
      </div>

      {/* ORDERS TABLE */}
      {loading ? (
        <div>Loading orders...</div>
      ) : orders.length === 0 ? (
        <div>No orders found</div>
      ) : (
        <div className="admin-card p-4">
          <table className="admin-table w-full">
            <thead>
              <tr>
                <th>ID</th>
                <th>Supplier</th>
                <th>Customer</th>
                <th>Total (₹)</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr
                  key={o.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => navigate(`/admin/orders/${o.id}`)}
                >
                  <td>{o.id}</td>
                  <td>{o.Supplier?.name || "N/A"}</td>
                  <td>{o.customerName}</td>
                  <td>₹{o.totalAmount}</td>
                  <td>
                    <span className={`admin-badge ${o.status}`}>
                      {o.status}
                    </span>
                  </td>
                  <td>{new Date(o.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
