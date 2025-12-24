import React, { useEffect, useState } from "react";
import { fetchOrdersForBuyer } from "../api/payments";
import { getBuyerId } from "../utils/session";
import { Link } from "react-router-dom";

export default function Orders() {
  const [orders, setOrders] = useState(null);
  const [loading, setLoading] = useState(true);
  const buyerId = getBuyerId();

  useEffect(() => {
    setLoading(true);
    fetchOrdersForBuyer(buyerId)
      .then((res) => setOrders(res || []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [buyerId]);

  if (loading) return <main style={{ padding: 20 }}>Loading orders…</main>;
  if (!orders || orders.length === 0) return <main style={{ padding: 20 }}>No orders found.</main>;

  return (
    <main style={{ padding: 20 }}>
      <h2>Your orders</h2>
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {orders.map((o) => (
          <li key={o.id} style={{ borderBottom: "1px solid #eee", padding: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <strong>Order #{o.id}</strong> — ?{o.total} — {o.status || o.paymentMethod}
              </div>
              <div>
                <Link to={`/orders/${o.id}`}>View details</Link>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
