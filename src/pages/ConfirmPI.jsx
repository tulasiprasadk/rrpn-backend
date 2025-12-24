import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchOrder, updateOrder } from "../api/payments";

/**
 * ConfirmPI page:
 * - Shows PI invoice (amount/address)
 * - Lets user upload screenshot of transfer
 * - Saves evidence to order.paymentEvidence
 */
export default function ConfirmPI() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
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
        status: "awaiting_verification",
        updatedAt: new Date().toISOString(),
      };
      const updated = await updateOrder(order.id, patch);
      setMsg("Submitted. Admin will verify and mark paid.");
      setTimeout(() => navigate("/"), 2000);
    } catch (err) {
      setMsg("Submit failed: " + (err?.message || ""));
    } finally {
      setLoading(false);
    }
  }

  if (!order) return <main style={{ padding: 20 }}>Loading invoice…</main>;

  return (
    <main style={{ padding: 20 }}>
      <h2>Confirm PI payment</h2>
      <p>Order id: {order.id}</p>
      <p>Amount: {order.piAmount} PI</p>
      <div style={{ marginBottom: 8 }}>
        <strong>Pay to:</strong>
        <div style={{ background: "#f7f7f7", padding: 10, borderRadius: 6, wordBreak: "break-all" }}>{order.piAddress}</div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 8, maxWidth: 700 }}>
        <label>
          Upload screenshot of PI transfer
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
