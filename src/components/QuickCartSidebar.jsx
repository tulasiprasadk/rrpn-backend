import React, { useState } from "react";
import { useNotifications } from "../contexts/NotificationContext";  // ✅ Correct import

// Diagnostic import to verify what Vite is loading
import * as TestNotif from "../contexts/NotificationContext";
console.log("Loaded NotificationContext exports:", TestNotif);

export default function QuickCartSidebar({ isOpen, onClose, cartItems = [], onCheckout }) {
  const { notify } = useNotifications();

  const handleCheckout = () => {
    notify({
      type: "success",
      title: "Checkout Successful",
      body: `You purchased ${cartItems.length} items.`,
      ttl: 4000,
    });

    if (onCheckout) onCheckout();
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        right: isOpen ? 0 : "-350px",
        width: "350px",
        height: "100vh",
        background: "#fff",
        boxShadow: "0 0 20px rgba(0,0,0,0.15)",
        transition: "right 0.3s ease",
        zIndex: 3000,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "16px",
          fontSize: "18px",
          fontWeight: "bold",
          borderBottom: "1px solid #eee",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span>Quick Cart</span>
        <button
          onClick={onClose}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            fontSize: "20px",
          }}
        >
          ×
        </button>
      </div>

      {/* Cart Items */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
        {cartItems.length === 0 ? (
          <div style={{ textAlign: "center", marginTop: "40px", color: "#777" }}>
            Cart is empty
          </div>
        ) : (
          cartItems.map((item) => (
            <div
              key={item.id}
              style={{
                padding: "12px",
                borderBottom: "1px solid #f0f0f0",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <div>
                <strong>{item.name}</strong>
                <div style={{ fontSize: "13px", color: "#555" }}>₹{item.price}</div>
              </div>
              <div>x{item.qty}</div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      {cartItems.length > 0 && (
        <div
          style={{
            padding: "16px",
            borderTop: "1px solid #eee",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          <button
            onClick={handleCheckout}
            style={{
              width: "100%",
              padding: "12px",
              background: "#2563eb",
              color: "#fff",
              borderRadius: "6px",
              border: "none",
              cursor: "pointer",
            }}
          >
            Checkout
          </button>
        </div>
      )}
    </div>
  );
}
