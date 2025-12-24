import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./OrderSuccess.css";

export default function OrderSuccess() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  return (
    <div className="os-container">
      <div className="os-card">
        <div className="os-icon">✔</div>

        <h1>Order Placed Successfully!</h1>
        <p>Your order has been placed and is now being processed.</p>

        {orderId && (
          <p className="os-order-id">
            Order ID: <strong>{orderId}</strong>
          </p>
        )}

        <button className="os-btn" onClick={() => navigate("/orders")}>
          View My Orders
        </button>

        <button className="os-home" onClick={() => navigate("/")}>
          Continue Shopping
        </button>
      </div>
    </div>
  );
}
