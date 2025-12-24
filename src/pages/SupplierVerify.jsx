import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { verifyOtp } from "../supplier/auth";

/**
 * Supplier OTP verification page.
 * Save as: src/pages/SupplierVerify.jsx
 */
export default function SupplierVerify() {
  const loc = useLocation();
  const navigate = useNavigate();
  const email = (loc.state && loc.state.email) || "";
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      await verifyOtp({ email, code });
      // on success navigate to supplier portal
      navigate("/supplier", { replace: true });
    } catch (err) {
      console.error("OTP verify error:", err);
      setErr(err?.message || "Verification failed");
    } finally {
      setBusy(false);
    }
  }

  if (!email) {
    return (
      <main style={{ padding: 24 }}>
        <h1>Missing identifier</h1>
        <p>No email/phone passed. Please go back to the login page and request OTP again.</p>
      </main>
    );
  }

  return (
    <main style={{ padding: 24 }}>
      <h1>Enter verification code</h1>
      <p>We sent an OTP to: <strong>{email}</strong>. Enter it below to verify your supplier account.</p>

      {err && <div style={{ color: "#ffb4b4", marginBottom: 12 }}>{err}</div>}

      <form onSubmit={submit} style={{ maxWidth: 420 }}>
        <label>
          OTP code
          <br />
          <input value={code} onChange={(e) => setCode(e.target.value)} style={{ width: "100%", padding: 8, marginBottom: 12 }} required />
        </label>

        <div>
          <button type="submit" disabled={busy} style={{ padding: "8px 14px", background: "#ffd600", border: "none", cursor: "pointer" }}>
            {busy ? "Verifying..." : "Verify"}
          </button>
        </div>
      </form>

      <p style={{ marginTop: 12, color: "#999" }}>Tip: in mock mode the OTP is logged to the browser console as "[Mock OTP] code for ...".</p>
    </main>
  );
}
