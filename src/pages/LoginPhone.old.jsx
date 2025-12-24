import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

/**
 * LoginPhone
 * - Enter phone number and request OTP
 */
export default function LoginPhone() {
  const [phone, setPhone] = useState("");
  const [msg, setMsg] = useState("");
  const [sending, setSending] = useState(false);
  const { sendOtp } = useAuth();
  const navigate = useNavigate();

  async function handleSend(e) {
    e.preventDefault();
    setMsg("");
    if (!phone || phone.length < 6) {
      setMsg("Please enter a valid phone number");
      return;
    }
    setSending(true);
    try {
      const res = await sendOtp(phone);
      setMsg(`OTP sent to ${phone}. (dev code: ${res.code})`);
      navigate(`/auth/otp?phone=${encodeURIComponent(phone)}`);
    } catch (err) {
      setMsg(err?.message || "Failed to send OTP");
    } finally {
      setSending(false);
    }
  }

  return (
    <main style={{ padding: 20 }}>
      <h2>Login / Verify phone</h2>
      <form onSubmit={handleSend} style={{ display: "grid", gap: 8, maxWidth: 420 }}>
        <label>
          Phone number
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. +919845036535 or 9845036535" />
        </label>
        <div style={{ display: "flex", gap: 8 }}>
          <button type="submit" disabled={sending} style={{ padding: "8px 12px" }}>{sending ? "Sending…" : "Send OTP"}</button>
          <button type="button" onClick={() => { setPhone(""); setMsg(""); }} style={{ padding: "8px 12px" }}>Clear</button>
        </div>
        {msg && <div style={{ color: "#333" }}>{msg}</div>}
      </form>
    </main>
  );
}
