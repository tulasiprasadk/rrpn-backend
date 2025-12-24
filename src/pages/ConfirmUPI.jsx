import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchOrder, updateOrder } from "../api/payments";

/**
 * ConfirmUPI page:
 * - Shows order info (UPI URI / QR)
 * - Lets user enter transaction reference (UTR/UNR) and/or upload a screenshot
 * - Saves evidence to order.paymentEvidence and order.utr (or utrText)
 */
export default function ConfirmUPI() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [utr, setUtr] = useState("");
  const [file, setFile] = useState(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!id) return;
    fetchOrder(id).then(setOrder).catch(() => setOrder(null));
  }, [id]);

  async function toBase64(file) {
    return new Promise((res, rej) => {
      const reader = new FileReader();
      reader.onload = () => res(reader.result);
      reader.onerror = rej;
      reader.readAsDataURL(file);
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!order) return;
    setLoading(true);
    setMsg("");
    try {
      let paymentEvidence = order.paymentEvidence || null;
      if (file) {
        paymentEvidence = await toBase64(file);
      }
      const patch = {
        paymentEvidence,
        utr: utr || null,
        status: "awaiting_verification",
        updatedAt: new Date().toISOString(),
      };
      const updated = await updateOrder(order.id, patch);
      setMsg("Submitted. Admin will verify and mark paid.");
      // Optionally navigate to a success page
      setTimeout(() => navigate("/"), 2000);
    } catch (err) {
      setMsg("Submit failed: " + (err?.message || ""));
    } finally {
      setLoading(false);
    }
  }

  if (!order) return <main style={{ padding: 20 }}>Loading order…</main>;

  return (
    <main style={{ padding: 20 }}>
      <h2>Confirm UPI payment</h2>
      <p>Order id: {order.id}</p>
      <p>Total: ?{order.total}</p>
      <p>Scan or use the UPI details below to pay:</p>
      <div style={{ marginBottom: 10 }}>
        <img src={order.upiQrUrl || order.upiUri ? (order.upiQrUrl || `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(order.upiUri)}`) : ""} alt="UPI QR" style={{ width: 200, height: 200 }} />
      </div>
      <div style={{ marginBottom: 8 }}>
        <strong>UPI URI:</strong> <code>{order.upiUri}</code>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 8, maxWidth: 700 }}>
        <label>
          Transaction ref (UTR / UNR)
          <input value={utr} onChange={(e) => setUtr(e.target.value)} />
        </label>
        <label>
          Upload screenshot of payment (optional)
          <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files && e.target.files[0])} />
        </label>

        <div style={{ display: "flex", gap: 8 }}>
          <button type="submit" disabled={loading} style={{ padding: "8px 12px" }}>{loading ? "Submitting..." : "Submit evidence"}</button>
          <button type="button" onClick={() => navigate(-1)} style={{ padding: "8px 12px" }}>Cancel</button>
        </div>

        {msg && <div style={{ color: "#333" }}>{msg}</div>}
      </form>
    </main>
  );
}
