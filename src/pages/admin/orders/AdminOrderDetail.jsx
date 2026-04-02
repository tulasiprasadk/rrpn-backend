import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../../api/client";

function formatCurrency(value) {
  const amount = Number(value || 0);
  return `Rs ${amount.toFixed(2)}`;
}

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
      const res = await api.get(`/admin/orders/${id}`);
      // API returns order object directly
      const ord = res.data.order || res.data;
      setOrder(ord);

      try {
        const setRes = await api.get(`/admin/orders/${id}/settlement`);
        setSettlement(setRes.data.settlement);
      } catch (settlementErr) {
        setSettlement(null);
      }
    } catch (err) {
      console.error("Failed to load order", err);
    }
    setLoading(false);
  }

  async function updateStatus(status) {
    try {
      await api.put(`/admin/orders/${id}/status`, { status });
      loadOrder();
    } catch (err) {
      console.error("Status update failed", err);
    }
  }

  async function approvePayment() {
    try {
      await api.put(`/admin/orders/${id}/approve`, {});
      loadOrder();
    } catch (err) {
      console.error("Approve failed", err);
    }
  }

  async function rejectPayment() {
    try {
      await api.put(`/admin/orders/${id}/reject`, {});
      loadOrder();
    } catch (err) {
      console.error("Reject failed", err);
    }
  }

  if (loading || !order) return <div className="p-4">Loading...</div>;

  const paymentInfo = order.paymentInfo && typeof order.paymentInfo === "object"
    ? order.paymentInfo
    : {};
  const subscriptionDraftId = paymentInfo.subscriptionDraftId || null;
  const subscriptionSummary = paymentInfo.subscriptionSummary || null;
  const subscriptionSelection = paymentInfo.subscriptionSelection || null;
  const subscriptionAmount = Number(
    subscriptionSummary?.totalPayable ||
    subscriptionSelection?.discountedPrice ||
    0
  );
  const orderAmount = Number(
    paymentInfo?.pricing?.baseAmount ||
    paymentInfo?.pricing?.subtotal ||
    paymentInfo?.pricing?.productAmount ||
    paymentInfo?.pricing?.serviceAmount ||
    (subscriptionAmount > 0 ? 0 : order.totalAmount) ||
    0
  );
  const payableNow = Number(order.totalAmount || subscriptionAmount || orderAmount || 0);
  const subscriptionItems = Array.isArray(subscriptionSummary?.items)
    ? subscriptionSummary.items
    : [];

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
        <div className="grid gap-2">
          <p>
            <strong>Product / order amount:</strong> {formatCurrency(orderAmount)}
          </p>
          <p>
            <strong>Subscription amount:</strong>{" "}
            {subscriptionAmount > 0 ? formatCurrency(subscriptionAmount) : "Not added"}
          </p>
          <p>
            <strong>Total Amount (Customer Paid):</strong> {formatCurrency(payableNow)}
          </p>
        </div>

        {(subscriptionSelection || subscriptionSummary) && (
          <div
            className="mt-4"
            style={{
              background: "#fff8e1",
              border: "1px solid rgba(210, 140, 0, 0.2)",
              borderRadius: 12,
              padding: 16
            }}
          >
            <h3 className="text-base font-semibold mb-2">Subscription Details</h3>
            <div className="grid gap-2 text-sm">
              <p>
                <strong>Plan:</strong>{" "}
                {subscriptionSummary?.durationLabel ||
                  subscriptionSelection?.label ||
                  subscriptionSelection?.duration ||
                  subscriptionSelection?.period ||
                  "Selected"}
              </p>
              {(subscriptionSummary?.frequencyLabel || subscriptionSelection?.frequency) && (
                <p>
                  <strong>Frequency:</strong>{" "}
                  {subscriptionSummary?.frequencyLabel || subscriptionSelection?.frequency}
                </p>
              )}
              {(subscriptionSummary?.planLabel || subscriptionSelection?.planType) && (
                <p>
                  <strong>Plan Type:</strong>{" "}
                  {subscriptionSummary?.planLabel || subscriptionSelection?.planType}
                </p>
              )}
              {subscriptionSummary?.itemCount ? (
                <p>
                  <strong>Included items:</strong> {subscriptionSummary.itemCount}
                </p>
              ) : null}
              {subscriptionSummary?.savings || subscriptionSelection?.savings ? (
                <p>
                  <strong>Customer savings:</strong>{" "}
                  {formatCurrency(subscriptionSummary?.savings || subscriptionSelection?.savings)}
                </p>
              ) : null}
              {subscriptionDraftId ? (
                <p>
                  <strong>Draft ID:</strong> #{subscriptionDraftId}
                </p>
              ) : null}
            </div>

            {subscriptionItems.length > 0 && (
              <details className="mt-3">
                <summary style={{ cursor: "pointer", fontWeight: 700 }}>
                  View subscription items
                </summary>
                <div className="grid gap-2 mt-3">
                  {subscriptionItems.map((item, index) => (
                    <div
                      key={`subscription-item-${index}`}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 12,
                        background: "#fff",
                        borderRadius: 10,
                        padding: "10px 12px"
                      }}
                    >
                      <span>
                        {item.title || item.metadata?.title || `Item ${index + 1}`} x {item.quantity || 1}
                      </span>
                      <strong>{formatCurrency(item.lineTotal || item.unitPrice || 0)}</strong>
                    </div>
                  ))}
                </div>
              </details>
            )}
          </div>
        )}

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



