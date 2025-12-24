import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function PaymentOptions({ items = [], total = 0 }) {
  const navigate = useNavigate();

  const [method, setMethod] = useState("upi"); // "upi" or "pi"
  const [loading, setLoading] = useState(false);

  const roundedTotal = Math.round((total + Number.EPSILON) * 100) / 100;

  // Hardcoded UPI receiver details (you can later move this into Admin settings)
  const UPI_VPA = "test@upi";
  const UPI_NAME = "RR Nagar Store";

  // Build UPI URI
  const upiUri = `upi://pay?pa=${encodeURIComponent(
    UPI_VPA
  )}&pn=${encodeURIComponent(
    UPI_NAME
  )}&am=${encodeURIComponent(
    roundedTotal.toFixed(2)
  )}&cu=INR&tn=RR Nagar Order`;

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
    upiUri
  )}`;

  // Pi details
  const PI_WALLET = "pi_wallet_address_goes_here";
  const PI_RATE = 200; // 1 PI = ?200, adjustable manually
  const piAmount = +(roundedTotal / PI_RATE).toFixed(6);

  const placeOrder = async () => {
    setLoading(true);

    try {
      const res = await fetch("/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          total: roundedTotal,
          paymentMethod: method, // "upi" or "pi"
          paid: false,
          status: "pending",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Failed to create order");
        setLoading(false);
        return;
      }

      navigate(`/order-success/${data.orderId}`);
    } catch (err) {
      console.error(err);
      alert("Server error");
    }

    setLoading(false);
  };

  return (
    <div style={{ border: "1px solid #ddd", padding: 16, borderRadius: 8 }}>
      <h3>Payment Options</h3>

      <div style={{ marginTop: 10 }}>
        <label>
          <input
            type="radio"
            name="pay"
            value="upi"
            checked={method === "upi"}
            onChange={() => setMethod("upi")}
          />{" "}
          UPI (Manual)
        </label>
      </div>

      {method === "upi" && (
        <div style={{ marginTop: 12 }}>
          <div>
            <strong>Pay to:</strong> {UPI_NAME}  
          </div>
          <div>
            <strong>UPI VPA:</strong> {UPI_VPA}
          </div>

          <img
            src={qrUrl}
            alt="UPI QR"
            style={{ width: 180, height: 180, marginTop: 10 }}
          />

          <button
            onClick={() => navigator.clipboard.writeText(upiUri)}
            style={{ marginTop: 10, padding: "8px 12px" }}
          >
            Copy UPI Payment Link
          </button>
        </div>
      )}

      <div style={{ marginTop: 20 }}>
        <label>
          <input
            type="radio"
            name="pay"
            value="pi"
            checked={method === "pi"}
            onChange={() => setMethod("pi")}
          />{" "}
          Pi Network (Manual)
        </label>
      </div>

      {method === "pi" && (
        <div style={{ marginTop: 12 }}>
          <div>
            <strong>Send PI to:</strong> {PI_WALLET}
          </div>
          <div>
            <strong>PI Rate:</strong> ?{PI_RATE} / PI
          </div>
          <div>
            <strong>You Pay:</strong> {piAmount} PI
          </div>
        </div>
      )}

      <button
        disabled={loading}
        onClick={placeOrder}
        style={{
          marginTop: 20,
          width: "100%",
          padding: "12px",
          background: "#0d6efd",
          color: "white",
          border: "none",
          borderRadius: 8,
          fontSize: 16,
        }}
      >
        {loading ? "Placing Order…" : `Place Order • ?${roundedTotal}`}
      </button>
    </div>
  );
}
