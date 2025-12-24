import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { API_BASE } from "../api/client";

export default function OrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    async function load() {
      const res = await axios.get(`${API_BASE}/orders/${id}`);
      setOrder(res.data);
    }
    load();
  }, [id]);

  if (!order) return <p style={{ padding: 20 }}>Loading...</p>;

  const address = order.Address;
  const product = order.Product;
  const supplier = order.Supplier;

  const badgeStyle = (status) => {
    const colors = {
      pending: "#f4ba00",
      approved: "#2ecc71",
      rejected: "#e74c3c",
      paid: "#2ecc71",
      created: "#3498db",
      delivered: "#16a085"
    };
    return {
      background: colors[status] || "#666",
      color: "white",
      padding: "5px 10px",
      borderRadius: 5,
      fontSize: 14,
      fontWeight: "bold"
    };
  };

  return (
    <div style={{ padding: 20, maxWidth: 650, margin: "0 auto" }}>

      <h2>Order #{order.id}</h2>

      {/* STATUS */}
      <div style={{ marginBottom: 20 }}>
        <span style={badgeStyle(order.paymentStatus)}>
          Payment: {order.paymentStatus}
        </span>

        <span style={{ ...badgeStyle(order.status), marginLeft: 10 }}>
          Order: {order.status}
        </span>
      </div>

      {/* PRODUCT INFO */}
      <div
        style={{
          padding: 15,
          border: "1px solid #ddd",
          borderRadius: 8,
          marginBottom: 20,
          display: "flex",
          gap: 15
        }}
      >
        <img
          src={product?.image || "https://via.placeholder.com/120"}
          alt="Product"
          style={{ width: 120, height: 120, borderRadius: 8, objectFit: "cover" }}
        />

        <div>
          <h3 style={{ margin: 0 }}>{product?.name}</h3>
          <p style={{ margin: "5px 0" }}>Qty: {order.qty}</p>
          <p style={{ fontWeight: "bold" }}>₹ {order.totalAmount}</p>
        </div>
      </div>

      {/* SUPPLIER BLOCK */}
      <div
        style={{
          padding: 15,
          border: "1px solid #ddd",
          borderRadius: 8,
          marginBottom: 20
        }}
      >
        <h3>Supplier</h3>
        <p style={{ margin: 0, fontWeight: "bold" }}>{supplier?.shopName}</p>
        <p style={{ margin: 0 }}>{supplier?.ownerName}</p>
        <p style={{ margin: 0 }}>{supplier?.phone}</p>
      </div>

      {/* ADDRESS BLOCK */}
      <div
        style={{
          padding: 15,
          border: "1px solid #ddd",
          borderRadius: 8,
          marginBottom: 20
        }}
      >
        <h3>Delivery Address</h3>
        {address ? (
          <>
            <p style={{ margin: 0 }}>
              <strong>{address.name}</strong> ({address.phone})
            </p>
            <p style={{ margin: 0 }}>
              {address.addressLine}, {address.city}, {address.state} –{" "}
              {address.pincode}
            </p>
          </>
        ) : (
          <p>No address found</p>
        )}
      </div>

      {/* PAYMENT SECTION */}
      <div
        style={{
          padding: 15,
          border: "1px solid #ddd",
          borderRadius: 8,
          marginBottom: 20
        }}
      >
        <h3>Payment Details</h3>

        <p>
          <strong>UNR:</strong> {order.paymentUNR || "Not submitted"}
        </p>

        {order.paymentScreenshot ? (
          <>
            <h4>Payment Screenshot</h4>
            <img
              src={order.paymentScreenshot}
              alt="Payment Proof"
              style={{
                width: "100%",
                maxWidth: 300,
                borderRadius: 8,
                border: "1px solid #ccc"
              }}
            />
          </>
        ) : (
          <p>No screenshot uploaded</p>
        )}
      </div>

      {/* ORDER TIMELINE */}
      <div
        style={{
          padding: 15,
          border: "1px solid #ddd",
          borderRadius: 8
        }}
      >
        <h3>Order Timeline</h3>

        <ul style={{ paddingLeft: 20 }}>
          <li>Order Created</li>

          {order.paymentUNR && <li>Payment Submitted</li>}

          {order.paymentStatus === "approved" && <li>Payment Approved</li>}

          {order.status === "delivered" && <li>Delivered Successfully</li>}
        </ul>
      </div>
    </div>
  );
}
