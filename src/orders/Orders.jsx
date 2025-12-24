import React, { useEffect, useState } from "react";
import { getBuyerId } from "../utils/session";
import { Link } from "react-router-dom";

async function fetchOrdersForBuyer(buyerId) {
  const res = await fetch(`/orders/buyer/${buyerId}`);
  if (!res.ok) throw new Error("Failed to load orders");
  return res.json();
}

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const buyerId = getBuyerId();
    if (!buyerId) {
      setLoading(false);
      return;
    }

    fetchOrdersForBuyer(buyerId)
      .then(setOrders)
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 20 }}>Loading your orders...</div>;

  if (orders.length === 0)
    return <div style={{ padding: 20 }}>You have no orders yet.</div>;

  return (
    <div style={{ padding: 20 }}>
      <h2>Your Orders</h2>

      {orders.map((order) => (
        <div
          key={order.id}
          style={{
            border: "1px solid #ccc",
            padding: 12,
            marginTop: 12,
            borderRadius: 8,
          }}
        >
          <div>
            <strong>Order ID:</strong> {order.id}
          </div>
          <div>
            <strong>Status:</strong> {order.status}
          </div>
          <div>
            <strong>Total:</strong> ₹{order.total}
          </div>

          <Link to={`/orders/${order.id}`} style={{ marginTop: 10, display: "inline-block" }}>
            View Details →
          </Link>
        </div>
      ))}
    </div>
  );
}
