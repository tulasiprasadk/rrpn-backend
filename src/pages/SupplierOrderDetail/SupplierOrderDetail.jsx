import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "./SupplierOrderDetail.css";

export default function SupplierOrderDetail() {
  const { orderId } = useParams();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");

  const loadOrder = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/supplier/orders/${orderId}`);
      const data = await res.json();

      if (!res.ok) {
        console.error(data);
        return;
      }

      setOrder(data.order);
      setStatus(data.order.status);
    } catch (err) {
      console.error("Order detail error:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadOrder();
  }, []);

  const updateStatus = async () => {
    try {
      const res = await fetch("/supplier/orders/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Failed to update order");
        return;
      }

      alert("Order status updated");
      loadOrder();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <div className="sod-loading">Loading order...</div>;
  }

  if (!order) {
    return <div className="sod-error">Order not found</div>;
  }

  return (
    <div className="sod-container">
      <h1>Order #{order.id}</h1>

      {/* CUSTOMER DETAILS */}
      <div className="sod-box">
        <h2>Customer</h2>
        <p><strong>Name:</strong> {order.customer_name}</p>
        <p><strong>Phone:</strong> {order.customer_phone}</p>
        <p><strong>Address:</strong> {order.delivery_address}</p>
      </div>

      {/* ITEMS */}
      <div className="sod-box">
        <h2>Items</h2>
        {order.items.map((item) => (
          <div className="sod-item" key={item.id}>
            <img src={item.image_url} alt={item.name} />

            <div>
              <h3>{item.name}</h3>

              {item.variety_name && <p>Variety: {item.variety_name}</p>}
              {item.subvariety_name && <p>Option: {item.subvariety_name}</p>}

              <p>Qty: {item.quantity}</p>
              <p>Price: ₹ {item.price}</p>
            </div>
          </div>
        ))}
      </div>

      {/* STATUS UPDATE */}
      <div className="sod-box">
        <h2>Update Status</h2>

        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="out_for_delivery">Out for Delivery</option>
          <option value="delivered">Delivered</option>
        </select>

        <button onClick={updateStatus} className="sod-btn">
          Update Status
        </button>
      </div>
    </div>
  );
}
