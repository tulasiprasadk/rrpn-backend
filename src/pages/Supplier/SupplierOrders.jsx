import React, { useEffect, useState } from "react";
import axios from "axios";
import "./SupplierOrders.css";

const API = "/api";

function SupplierOrders() {
  const [orders, setOrders] = useState([]);

  const loadOrders = async () => {
    try {
      const res = await axios.get(`${API}/orders/supplier`, {
        headers: { Authorization: "Bearer " + localStorage.getItem("token") }
      });
      setOrders(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const openOrder = (id) => {
    window.location.href = `/supplier/orders/${id}`;
  };

  return (
    <div className="supplier-orders-page">
      <h2>Supplier Dashboard</h2>
      <h3>Incoming Orders</h3>

      {orders.length === 0 && <p>No orders received yet.</p>}

      {orders.map((order) => (
        <div
          key={order.id}
          className={`supplier-order-card status-${order.status}`}
          onClick={() => openOrder(order.id)}
        >
          <p><strong>Order ID:</strong> {order.id}</p>
          <p><strong>Customer:</strong> {order.user_name}</p>
          <p><strong>Phone:</strong> {order.user_phone}</p>
          <p><strong>Total:</strong> ₹{order.total_amount}</p>
          <p className="status-tag">{order.status}</p>
        </div>
      ))}
    </div>
  );
}

export default SupplierOrders;
