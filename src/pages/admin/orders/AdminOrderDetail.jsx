import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

export default function AdminOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [settlement, setSettlement] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrder();
  }, [id]);

  async function loadOrder() {
    setLoading(true);
    try {
      const res = await axios.get(`/api/admin/orders/${id}`, { withCredentials: true });
      // API returns order object directly
      const ord = res.data.order || res.data;
      setOrder(ord);

      const setRes = await axios.get(`/api/admin/orders/${id}/settlement`, { withCredentials: true });
      setSettlement(setRes.data.settlement);
    } catch (err) {
      console.error("Failed to load order", err);
    }
    setLoading(false);
  }

  async function updateStatus(status) {
    try {
      await axios.put(`/api/admin/orders/${id}/status`, { status }, { withCredentials: true });
      loadOrder();
    } catch (err) {
      console.error("Status update failed", err);
    }
  }

  async function approvePayment() {
    try {
      await axios.put(`/api/admin/orders/${id}/approve`, {}, { withCredentials: true });
      loadOrder();
    } catch (err) {
      console.error("Approve failed", err);
    }
  }

  async function rejectPayment() {
    try {
      await axios.put(`/api/admin/orders/${id}/reject`, {}, { withCredentials: true });
      loadOrder();
    } catch (err) {
      console.error("Reject failed", err);
    }
  }

  if (loading || !order) return <div className="p-4">Loading...</div>;

  return (
    <div className="p-4">
      <button className="admin-button outline mb-4" onClick={() => navigate(-1)}>
        ← Back
      </button>

      <h1 className="text-2xl font-semibold mb-2">Order #{order.id}</h1>

      {/* CUSTOMER INFO */}
      <div className="admin-card p-4 mb-4">
        <h2 className="text-lg font-semibold mb-2">Customer</h2>
        <p>Name: {order.customerName}</p>
        <p>Phone: {order.customerPhone}</p>
        <p>Address: {order.customerAddress}</p>
      </div>

      {/* SUPPLIER INFO */}
      <div className="admin-card p-4 mb-4">
        <h2 className="text-lg font-semibold mb-2">Supplier</h2>
        <p>{order.Supplier?.name}</p>
        <p>{order.Supplier?.phone}</p>
        <p>{order.Supplier?.email}</p>
      </div>

      {/* ORDER AMOUNTS */}
      <div className="admin-card p-4 mb-4">
        <h2 className="text-lg font-semibold mb-2">Amount Summary</h2>
        <p>Total Amount (Customer Paid): ₹{order.totalAmount}</p>

        {settlement && (
          <>
            <p>Platform Fee: ₹{settlement.platformFee}</p>
            <p>Tax Estimate: ₹{settlement.taxEstimate}</p>
            <p><b>Supplier Earning:</b> ₹{settlement.supplierEarning}</p>
          </>
        )}
      </div>

      {/* STATUS */}
      <div className="admin-card p-4 mb-4">
        <h2 className="text-lg font-semibold mb-2">Order Status</h2>
        <span className={`admin-badge ${order.status}`}>{order.status}</span>

        <div className="mt-3">
          <p className="text-sm text-gray-700">Payment Status: <strong>{order.paymentStatus || "n/a"}</strong></p>
          {order.paymentUNR && <p className="text-sm text-gray-700">UNR: {order.paymentUNR}</p>}
          {order.paymentScreenshot && (
            <div className="mt-2">
              <img
                src={order.paymentScreenshot.startsWith("http") ? order.paymentScreenshot : `${order.paymentScreenshot}`}
                alt="Payment Screenshot"
                style={{ maxWidth: 320, border: "1px solid #ddd", borderRadius: 6 }}
                onError={(e) => { e.currentTarget.style.display = "none"; }}
              />
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-3">
          <button
            className="admin-button"
            onClick={() => updateStatus("paid")}
          >
            Mark as Paid
          </button>

          <button
            className="admin-button primary"
            onClick={() => updateStatus("delivered")}
          >
            Mark as Delivered
          </button>

          <button
            className="admin-button bg-red-600 text-white"
            onClick={() => updateStatus("cancelled")}
          >
            Cancel Order
          </button>
        </div>

        {order.paymentStatus === "pending" && (
          <div className="flex gap-3 mt-4">
            <button className="admin-button primary" onClick={approvePayment}>
              Approve Payment
            </button>
            <button className="admin-button bg-red-600 text-white" onClick={rejectPayment}>
              Reject Payment
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
