import React, { useEffect, useState } from "react";
import axios from "axios";

const API = "/api";

const steps = [
  "pending",
  "confirmed",
  "packed",
  "out_for_delivery",
  "delivered"
];

function OrderDetail() {
  const id = window.location.pathname.split("/").pop();
  const [order, setOrder] = useState(null);

  const loadOrder = async () => {
    try {
      const res = await axios.get(`${API}/orders/${id}`, {
        headers: { Authorization: "Bearer " + localStorage.getItem("token") }
      });
      setOrder(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadOrder();
  }, []);

  if (!order) return <p>Loading...</p>;

  const currentStep = steps.indexOf(order.order.status);

  return (
    <div className="order-detail">
      <h2>Order Details</h2>

      <h3>Status Timeline</h3>
      <div className="timeline">
        {steps.map((step, i) => (
          <div
            key={step}
            className={`step ${i <= currentStep ? "done" : ""}`}
          >
            {step.replace("_", " ")}
          </div>
        ))}
      </div>

      <h3>Items</h3>
      {order.items.map((item) => (
        <div className="order-item" key={item.id}>
          <img src={item.product_images?.[0]} alt="" />
          <div>
            <p>{item.product_name}</p>
            <p>{item.variety_name}</p>
            {item.sub_variety_name && <p>{item.sub_variety_name}</p>}
            <p>Qty: {item.quantity}</p>
            <p>₹{item.total_price}</p>
          </div>
        </div>
      ))}

      <h3>Total: ₹{order.order.total_amount}</h3>
    </div>
  );
}

export default OrderDetail;
