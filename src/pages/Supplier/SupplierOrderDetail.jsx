import React, { useEffect, useState } from "react";
import axios from "axios";
import "./SupplierOrderDetail.css";

const API = "/api";

const statuses = [
  "confirmed",
  "packed",
  "out_for_delivery",
  "delivered",
  "cancelled"
];

function SupplierOrderDetail() {
  const orderId = window.location.pathname.split("/").pop();
  const [data, setData] = useState(null);

  const loadOrder = async () => {
    try {
      const res = await axios.get(`${API}/orders/${orderId}`, {
        headers: { Authorization: "Bearer " + localStorage.getItem("token") }
      });
      setData(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const updateStatus = async (newStatus) => {
    try {
      await axios.post(
        `${API}/orders/${orderId}/status`,
        { status: newStatus },
        { headers: { Authorization: "Bearer " + localStorage.getItem("token") } }
      );
      loadOrder();
    } catch (err) {
      console.error(err);
      alert("Failed to update status");
    }
  };

  useEffect(() => {
    loadOrder();
  }, []);

  if (!data) return <p>Loading order...</p>;

  const { order, items } = data;

  return (
    <div className="supplier-order-detail">
      <h2>Order Detail</h2>

      <div className="box">
        <p><strong>Order ID:</strong> {order.id}</p>
        <p><strong>Customer:</strong> {order.user_name}</p>
        <p><strong>Phone:</strong> {order.user_phone}</p>
        <p><strong>Total Amount:</strong> ₹{order.total_amount}</p>
        <p><strong>Status:</strong> {order.status}</p>
      </div>

      <h3>Update Status</h3>
      <div className="status-buttons">
        {statuses.map((st) => (
          <button
            key={st}
            className={order.status === st ? "active" : ""}
            onClick={() => updateStatus(st)}
          >
            {st.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      <h3>Items</h3>
      {items.map((item) => (
        <div className="supplier-order-item" key={item.id}>
          <img src={item.product_images?.[0]} alt={item.product_name ? `Product image of ${item.product_name}` : 'Product image'} />
          <div>
            <p>{item.product_name}</p>
            <p>{item.variety_name}</p>
            {item.sub_variety_name && <p>{item.sub_variety_name}</p>}
            <p>Qty: {item.quantity}</p>
            <p>₹{item.total_price}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default SupplierOrderDetail;
