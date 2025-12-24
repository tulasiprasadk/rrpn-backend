import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

export default function OrderDetail() {
  const { id } = useParams();
  const token = localStorage.getItem("customerToken");

  const [data, setData] = useState(null);

  useEffect(() => {
    axios.get(`/api/customer/orders/${id}`, {
      headers: { Authorization: "Bearer " + token }
    }).then(res => setData(res.data));
  }, []);

  if (!data) return "Loading...";

  const { order, items } = data;

  return (
    <div>
      <h2>Order #{order.id}</h2>
      <p>Status: {order.status}</p>
      <p>Total: ₹{order.total}</p>

      <h3>Items</h3>
      {items.map(i => (
        <div key={i.id}>
          {i.Product.name} — {i.quantity} × ₹{i.price}
        </div>
      ))}
    </div>
  );
}
