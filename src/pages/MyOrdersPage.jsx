import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function MyOrdersPage() {
  const [orders, setOrders] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      const res = await axios.get("/api/orders");
      setOrders(res.data);
    }
    load();
  }, []);

  const badge = (text, type) => {
    const colors = {
      pending: "#f4ba00",
      approved: "#2ecc71",
      rejected: "#e74c3c",
      paid: "#2ecc71",
      created: "#3498db",
      delivered: "#16a085",
      default: "#555",
    };

    return (
      <span
        style={{
          background: colors[type] || colors.default,
          color: "white",
          padding: "4px 10px",
          borderRadius: 5,
          fontSize: 12,
          marginRight: 6,
        }}
      >
        {text}
      </span>
    );
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>My Orders</h2>

      {orders.length === 0 && <p>No orders found.</p>}

      {orders.map((o) => {
        const product = o.Product;
        const date = new Date(o.createdAt).toLocaleDateString();

        return (
          <div
            key={o.id}
            style={{
              border: "1px solid #ddd",
              borderRadius: 10,
              padding: 15,
              marginBottom: 15,
              display: "flex",
              gap: 15,
              cursor: "pointer",
              background: "#fafafa",
            }}
            onClick={() => navigate(`/my-orders/${o.id}`)}
          >
            {/* Product Image */}
            <img
              src={product?.image || "https://via.placeholder.com/90"}
              style={{
                width: 90,
                height: 90,
                borderRadius: 8,
                objectFit: "cover",
              }}
              alt="Product"
            />

            {/* Order Info */}
            <div style={{ flexGrow: 1 }}>
              <h3 style={{ margin: "0 0 5px 0" }}>
                {product?.title || product?.name || "Product"}
                {product?.titleKannada && (
                  <div style={{ fontSize: '14px', color: '#c8102e', marginTop: '2px', fontWeight: 'normal' }}>
                    {product.titleKannada}
                  </div>
                )}
              </h3>

              <p style={{ margin: 0, color: "#444" }}>₹ {o.totalAmount}</p>
              <p style={{ margin: "5px 0", fontSize: 13, color: "#777" }}>
                Ordered on {date}
              </p>

              {/* STATUS BADGES */}
              <div style={{ marginTop: 5 }}>
                {badge("Payment: " + o.paymentStatus, o.paymentStatus)}
                {badge("Order: " + o.status, o.status)}
              </div>
            </div>

            {/* VIEW DETAILS BUTTON */}
            <button
              style={{
                alignSelf: "center",
                padding: "6px 12px",
                background: "#3498db",
                color: "white",
                border: "none",
                borderRadius: 5,
                fontSize: 12,
              }}
            >
              View
            </button>
          </div>
        );
      })}
    </div>
  );
}
