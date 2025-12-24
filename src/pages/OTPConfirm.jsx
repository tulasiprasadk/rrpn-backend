import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE } from "../api/client";

/**
 * OTP confirmation page.
 * - Expects ?phone=<phone> in query string
 */
export default function OTPConfirm() {
  const [searchParams] = useSearchParams();
  const phone = searchParams.get("phone") || "";
  const [code, setCode] = useState("");
  const [remember, setRemember] = useState(true);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!phone) navigate("/login");
  }, [phone, navigate]);

  async function handleVerify(e) {
    e.preventDefault();
    setMsg("");
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/auth/verify-otp`, { 
        phone, 
        otp: code 
      });
      
      console.log("OTP verification response:", res.data);
      setMsg("Verified!");
      
      if (res.data.isNewUser) {
        // New user needs to add address
        setTimeout(() => navigate("/verify", { state: { phone } }), 600);
      } else {
        // Existing user goes to cart/checkout
        setTimeout(() => navigate("/cart"), 600);
      }
    } catch (err) {
      setMsg(err?.response?.data?.error || err?.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ padding: 20 }}>
      <h2>Enter OTP</h2>
      <p>We sent a one-time code to <strong>{phone}</strong>.</p>
      <form onSubmit={handleVerify} style={{ display: "grid", gap: 8, maxWidth: 420 }}>
        <label>
          OTP
          <input 
            value={code} 
            onChange={(e) => setCode(e.target.value)} 
            placeholder="123456"
            disabled={loading}
          />
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input 
            type="checkbox" 
            checked={remember} 
            onChange={(e) => setRemember(e.target.checked)}
            disabled={loading}
          />
          Remember me on this device
        </label>
        <div style={{ display: "flex", gap: 8 }}>
          <button type="submit" disabled={loading} style={{ padding: "8px 12px" }}>
            {loading ? "Verifying..." : "Verify & Sign in"}
          </button>
          <button type="button" onClick={() => navigate(-1)} disabled={loading} style={{ padding: "8px 12px" }}>Cancel</button>
        </div>
        {msg && <div style={{ color: msg.includes("Verified") ? "green" : "crimson" }}>{msg}</div>}
      </form>
    </main>
  );
}
