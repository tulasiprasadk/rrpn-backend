import React, { useState, useEffect } from "react";
import PaymentOptions from "../components/PaymentOptions";
import { fetchOrder } from "../api/orders";

/**
 * Example Checkout page.
 * - Loads a 'cart' from localStorage (simple cart format expected)
 * - Shows PaymentOptions and a success view after order is created.
 */
export default function Checkout() {
  const [cart, setCart] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("cart") || "[]");
    } catch (e) {
      return [];
    }
  });
  const total = cart.reduce((s, it) => s + (it.price || 0) * (it.qty || 1), 0);
  const [order, setOrder] = useState(null);

  function handleSuccess(createdOrder) {
    // createdOrder returned from json-server will have id
    setOrder(createdOrder);
    // optionally clear cart
    localStorage.removeItem("cart");
  }

  useEffect(() => {
    // If the user returns from an external flow with an orderId param, fetch it:
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get("orderId");
    if (orderId) {
      fetchOrder(orderId).then(setOrder).catch(() => {});
    }
  }, []);

  if (order) {
    return (
      <main style={{ padding: 20 }}>
        <h2>Order placed</h2>
        <p>Order id: {order.id}</p>
        <p>Payment method: {order.paymentMethod}</p>
        <p>Paid: {order.paid ? "Yes" : "No"}</p>
      </main>
    );
  }

  return (
    <main style={{ padding: 20 }}>
      <h2>Checkout</h2>
      <div style={{ display: "flex", gap: 24 }}>
        <section style={{ flex: 2 }}>
          <h3>Items</h3>
          {cart.length === 0 ? <div>No items in cart</div> : cart.map((it) => (
            <div key={it.id} style={{ borderBottom: "1px solid #eee", padding: 8 }}>
              {it.title} — ?{it.price} × {it.qty}
            </div>
          ))}
          <div style={{ marginTop: 12 }}><strong>Total: ?{total}</strong></div>
        </section>
        <aside style={{ width: 360 }}>
          <PaymentOptions items={cart} total={total} onSuccess={handleSuccess} />
        </aside>
      </div>
    </main>
  );
}
