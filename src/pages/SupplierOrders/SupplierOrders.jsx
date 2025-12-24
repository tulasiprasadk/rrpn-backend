import { useEffect, useState } from "react";
import axios from "axios";

export default function SupplierOrders() {
  const [orders, setOrders] = useState([]);

  const load = async () => {
    const res = await axios.get("/api/supplier/orders");
    setOrders(res.data);
  };

  useEffect(() => {
    load();
  }, []);

  const markDelivered = async (id) => {
    await axios.put(`/api/supplier/orders/${id}/deliver`);
    alert("Order marked as delivered");
    load();
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Supplier Orders</h2>

      {orders.length === 0 && <p>No orders yet.</p>}

      {orders.map((o) => {
        const address = o.Address;
        const product = o.Product;

        return (
          <div
            key={o.id}
            style={{
              border: "1px solid #ddd",
              padding: 15,
              marginBottom: 15,
              borderRadius: 10,
              background: "#f9f9f9",
            }}
          >
            <h3>Order #{o.id}</h3>

            <p>
              <strong>Product:</strong> {product?.name}
            </p>

            <p>
              <strong>Qty:</strong> {o.qty}
            </p>

            <p>
              <strong>Amount:</strong> ₹{o.totalAmount}
            </p>

            <p>
              <strong>Payment Status:</strong> {o.paymentStatus}
            </p>

            {/* Delivery Address */}
            <div style={{ marginTop: 10 }}>
              <strong>Delivery Address:</strong>
              <p style={{ margin: 0 }}>
                {address?.name} ({address?.phone})
              </p>
              <p style={{ margin: 0 }}>
                {address?.addressLine}, {address?.city}, {address?.state} –{" "}
                {address?.pincode}
              </p>
            </div>

            {/* ACTION BUTTON */}
            {o.status !== "delivered" ? (
              <button
                onClick={() => markDelivered(o.id)}
                style={{
                  marginTop: 15,
                  padding: "10px 15px",
                  background: "green",
                  color: "white",
                  border: "none",
                  borderRadius: 5,
                }}
              >
                Mark as Delivered
              </button>
            ) : (
              <p style={{ color: "green", fontWeight: "bold", marginTop: 10 }}>
                ✔ Delivered
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
