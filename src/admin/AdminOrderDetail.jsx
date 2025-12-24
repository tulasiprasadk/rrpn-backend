import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

export default function AdminOrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);

  const load = async () => {
    const res = await axios.get(`/api/admin/orders/${id}`);
    setOrder(res.data);
  };

  useEffect(() => {
    load();
  }, []);

  if (!order) return <p>Loading...</p>;

  const approve = async () => {
    await axios.put(`/api/admin/orders/${id}/approve`);
    alert("Payment Approved");
    load();
  };

  const reject = async () => {
    await axios.put(`/api/admin/orders/${id}/reject`);
    alert("Payment Rejected");
    load();
  };

  const address = order.Address;

  return (
    <div style={{ padding: 20 }}>
      <h2>Order #{order.id}</h2>

      <h3>Customer</h3>
      <p>{order.customerName}</p>
      <p>{order.customerPhone}</p>
      <p>{order.customerAddress}</p>

      {address && (
        <>
          <h3>Delivery Address</h3>
          <p>
            {address.name} ({address.phone})<br />
            {address.addressLine}, {address.city}, {address.state} – {address.pincode}
          </p>
        </>
      )}

      <h3>Payment UNR</h3>
      <p>{order.paymentUNR || "Not Submitted"}</p>

      <h3>Payment Screenshot</h3>
      {order.paymentScreenshot ? (
        <img
          src={order.paymentScreenshot}
          alt="Payment Screenshot"
          style={{ width: 300, border: "1px solid #ccc" }}
        />
      ) : (
        <p>No screenshot found</p>
      )}

      <h3>Payment Status</h3>
      <p>{order.paymentStatus}</p>

      {(order.paymentStatus === "pending") && (
        <div style={{ marginTop: 20 }}>
          <button
            onClick={approve}
            style={{ background: "green", color: "white", marginRight: 10 }}
          >
            Approve Payment
          </button>

          <button
            onClick={reject}
            style={{ background: "red", color: "white" }}
          >
            Reject Payment
          </button>
        </div>
      )}
    </div>
  );
}
