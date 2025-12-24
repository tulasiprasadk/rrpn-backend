import React, { useEffect, useState } from "react";
import { fetchOrder } from "../api/orders";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getBuyerId } from "../utils/session";

export default function OrderDetails() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const buyerId = getBuyerId();
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetchOrder(id)
      .then((o) => setOrder(o))
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <main style={{ padding: 20 }}>Loading order…</main>;
  if (!order) return <main style={{ padding: 20 }}>Order not found.</main>;

  const isOwner = order.buyerId === buyerId;
  return (
    <main style={{ padding: 20 }}>
      <h2>Order #{order.id}</h2>
      <div><strong>Total:</strong> ?{order.total}</div>
      <div><strong>Payment method:</strong> {order.paymentMethod}</div>
      <div><strong>Status:</strong> {order.status || (order.paid ? "paid" : "pending")}</div>

      {order.paymentEvidence && (
        <div style={{ marginTop: 12 }}>
          <strong>Payment evidence:</strong>
          <div style={{ marginTop: 8 }}>
            <img src={order.paymentEvidence} alt="payment evidence" style={{ maxWidth: 320, border: "1px solid #ddd", borderRadius: 6 }} />
          </div>
        </div>
      )}

      {order.utr && (
        <div style={{ marginTop: 12 }}>
          <strong>Transaction ref (UTR / UNR):</strong>
          <div style={{ marginTop: 6 }}>{order.utr}</div>
        </div>
      )}

      <div style={{ marginTop: 16 }}>
        {isOwner && order.status !== "paid" && (
          <>
            {order.paymentMethod === "upi" && <button onClick={() => navigate(`/confirm/upi/${order.id}`)} style={{ padding: "8px 12px", marginRight: 8 }}>Submit UNR / Upload screenshot</button>}
            {order.paymentMethod === "pi" && <button onClick={() => navigate(`/confirm/pi/${order.id}`)} style={{ padding: "8px 12px", marginRight: 8 }}>Upload PI screenshot</button>}
          </>
        )}
        <Link to="/orders">Back to orders</Link>
      </div>
    </main>
  );
}
