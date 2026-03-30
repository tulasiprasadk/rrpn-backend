import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../api/client";

function extractOrdersPayload(payload) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];
  if (Array.isArray(payload.orders)) return payload.orders;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.items)) return payload.items;
  if (Array.isArray(payload.rows)) return payload.rows;
  if (payload.orders && Array.isArray(payload.orders.rows)) return payload.orders.rows;
  if (payload.data && Array.isArray(payload.data.rows)) return payload.data.rows;
  return [];
}

function buildOrdersFromNotifications(notifications) {
  return (Array.isArray(notifications) ? notifications : [])
    .filter((item) => item?.type === "payment_submitted")
    .map((item) => {
      let meta = null;
      try {
        meta = item?.meta ? JSON.parse(item.meta) : null;
      } catch (_err) {
        meta = null;
      }

      const orderId =
        meta?.orderId ||
        item?.message?.match(/order\s*#(\d+)/i)?.[1] ||
        item?.message?.match(/\b#(\d+)\b/)?.[1] ||
        item?.id;

      return {
        id: Number(orderId) || orderId,
        notificationId: item?.id,
        Supplier: { name: "Pending Review" },
        customerName: item?.message?.match(/Customer:\s*([^,]+)/i)?.[1] || "Customer",
        totalAmount: meta?.totalAmount || meta?.amount || "",
        status: "created",
        paymentStatus: "pending",
        createdAt: item?.createdAt || new Date().toISOString(),
        _notificationFallback: true,
      };
    });
}

function extractNotificationsPayload(payload) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];
  if (Array.isArray(payload.notifications)) return payload.notifications;
  if (Array.isArray(payload.data)) return payload.data;
  return [];
}

export default function AdminOrdersList() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [status, setStatus] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [suppliers, setSuppliers] = useState([]);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  useEffect(() => {
    loadSuppliers();
    loadOrders();
  }, []);

  async function loadSuppliers() {
    try {
      const res = await api.get("/admin/suppliers");
      setSuppliers(res.data.data || res.data || []);
    } catch (err) {
      console.error("Failed to load suppliers", err);
    }
  }

  async function loadOrders() {
    setLoading(true);
    setError("");

    async function loadNotificationFallback() {
      const notifyRes = await api.get("/admin/notifications");
      const fallbackOrders = buildOrdersFromNotifications(
        extractNotificationsPayload(notifyRes.data)
      );
      setOrders(fallbackOrders);
      return fallbackOrders;
    }

    try {
      const res = await api.get("/admin/orders", {
        params: {
          status,
          supplierId,
          date_from: dateFrom,
          date_to: dateTo,
        },
      });

      const payload = extractOrdersPayload(res.data);
      if (payload.length > 0) {
        setOrders(payload);
      } else {
        try {
          const paymentRes = await api.get("/admin/payments");
          const paymentOrders = extractOrdersPayload(paymentRes.data);
          if (paymentOrders.length > 0) {
            setOrders(paymentOrders);
          } else {
            await loadNotificationFallback();
          }
        } catch (_paymentErr) {
          await loadNotificationFallback();
        }
      }
    } catch (err) {
      console.error("Failed to load orders", err);
      setError(err?.response?.data?.error || err?.message || "Failed to load orders");

      try {
        try {
          const paymentRes = await api.get("/admin/payments");
          const paymentOrders = extractOrdersPayload(paymentRes.data);
          if (paymentOrders.length > 0) {
            setOrders(paymentOrders);
          } else {
            await loadNotificationFallback();
          }
        } catch (_paymentErr) {
          await loadNotificationFallback();
        }
      } catch (_fallbackErr) {
        setOrders([]);
      }
    }

    setLoading(false);
  }

  async function approvePayment(orderId) {
    const order = orders.find((item) => String(item.id) === String(orderId));
    try {
      setActionLoadingId(orderId);
      try {
        await api.put(`/admin/orders/${orderId}/approve`, {});
      } catch (err) {
        if (err?.response?.status === 404) {
          try {
            await api.post(`/admin/payments/${orderId}/approve`, {});
          } catch (paymentErr) {
            if (paymentErr?.response?.status === 404 && order?.notificationId) {
              await api.post(`/admin/payments/notifications/${order.notificationId}/approve`, {});
            } else {
              throw paymentErr;
            }
          }
        } else {
          throw err;
        }
      }
      await loadOrders();
    } catch (err) {
      alert(err?.response?.data?.error || err?.message || "Failed to approve payment");
    } finally {
      setActionLoadingId(null);
    }
  }

  async function rejectPayment(orderId) {
    const order = orders.find((item) => String(item.id) === String(orderId));
    try {
      setActionLoadingId(orderId);
      try {
        await api.put(`/admin/orders/${orderId}/reject`, {});
      } catch (err) {
        if (err?.response?.status === 404) {
          try {
            await api.post(`/admin/payments/${orderId}/reject`, {});
          } catch (paymentErr) {
            if (paymentErr?.response?.status === 404 && order?.notificationId) {
              await api.post(`/admin/payments/notifications/${order.notificationId}/reject`, {});
            } else {
              throw paymentErr;
            }
          }
        } else {
          throw err;
        }
      }
      await loadOrders();
    } catch (err) {
      alert(err?.response?.data?.error || err?.message || "Failed to reject payment");
    } finally {
      setActionLoadingId(null);
    }
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-semibold mb-4">Orders</h1>

      <div className="admin-card p-4 mb-4 grid grid-cols-1 md:grid-cols-4 gap-3">
        <div>
          <label className="block text-sm">Status</label>
          <select className="admin-input" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All</option>
            <option value="created">Created</option>
            <option value="paid">Paid</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div>
          <label className="block text-sm">Supplier</label>
          <select className="admin-input" value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
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
          <input type="date" className="admin-input" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </div>

        <div>
          <label className="block text-sm">Date To</label>
          <input type="date" className="admin-input" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>

        <div className="col-span-full">
          <button className="admin-button primary" onClick={loadOrders}>
            Apply Filters
          </button>
        </div>
      </div>

      {error && (
        <div className="admin-card p-4 mb-4" style={{ color: "#b91c1c" }}>
          {error}
          {orders.length > 0 ? " Showing notification-based payment review list instead." : ""}
        </div>
      )}

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
                <th>Total (Rs)</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr
                  key={order.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => navigate(`/admin/orders/${order.id}`)}
                >
                  <td>{order.id}</td>
                  <td>{order.Supplier?.name || "N/A"}</td>
                  <td>{order.customerName || "Customer"}</td>
                  <td>{order.totalAmount ? `Rs ${order.totalAmount}` : "Pending"}</td>
                  <td>
                    <span className={`admin-badge ${order.paymentStatus === "pending" ? "pending" : order.status}`}>
                      {order.paymentStatus === "pending" ? "payment pending" : order.status}
                    </span>
                  </td>
                  <td>{new Date(order.createdAt).toLocaleString()}</td>
                  <td onClick={(event) => event.stopPropagation()}>
                    {order.paymentStatus === "pending" ? (
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button
                          className="admin-button primary"
                          disabled={actionLoadingId === order.id}
                          onClick={() => approvePayment(order.id)}
                        >
                          {actionLoadingId === order.id ? "Working..." : "Approve"}
                        </button>
                        <button
                          className="admin-button"
                          style={{ background: "#dc2626", color: "#fff" }}
                          disabled={actionLoadingId === order.id}
                          onClick={() => rejectPayment(order.id)}
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <button
                        className="admin-button outline"
                        onClick={() => navigate(`/admin/orders/${order.id}`)}
                      >
                        View
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
