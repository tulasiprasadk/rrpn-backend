import React from "react";
import "./OrdersPreview.css";

export default function OrdersPreview() {
  return (
    <div className="orders-box">
      <h2>My Recent Orders</h2>

      <div className="order-item">
        <div>UNR1234</div>
        <span className="order-status pending">Pending</span>
      </div>

      <div className="order-item">
        <div>UNR1228</div>
        <span className="order-status success">Completed</span>
      </div>
    </div>
  );
}
