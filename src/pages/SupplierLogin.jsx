
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function SupplierLogin() {
  const [form, setForm] = useState({ email: "", otp: "" });
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const navigate = useNavigate();

  function update(field) {
    return (e) => setForm({ ...form, [field]: e.target.value });
  }

  async function sendOTP() {
    setErr("");
    setSuccess("");
    setLoading(true);

    if (!form.email) {
      setErr("Please provide your email address.");
      setLoading(false);
      return;
    }

    try {
      const res = await axios.post("/api/supplier/auth/request-email-otp", { email: form.email });
      if (res.data.success || res.data.message) {
        setSuccess("OTP sent to " + form.email);
        setOtpSent(true);
      }
    } catch (error) {
      setErr(error?.response?.data?.error || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  }

  async function submit(e) {
    e.preventDefault();
    setErr("");
    setSuccess("");
    setLoading(true);

    if (!form.email) {
      setErr("Please provide your email address.");
      setLoading(false);
      return;
    }
    if (!form.otp) {
      setErr("Please enter the OTP.");
      setLoading(false);
      return;
    }

    try {
      const res = await axios.post("/api/supplier/auth/verify-email-otp", { email: form.email, otp: form.otp }, { withCredentials: true });
      if (res.data.success) {
        setSuccess("Login successful!");
        navigate("/supplier/dashboard");
      }
    } catch (error) {
      setErr(error?.response?.data?.error || "Failed to login");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ padding: 24, maxWidth: 500, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 24 }}>Supplier Sign In</h1>

      {err && <div style={{ color: "red", marginBottom: 12, padding: 10, background: "#ffebee", borderRadius: 4 }}>{err}</div>}
      {success && <div style={{ color: "green", marginBottom: 12, padding: 10, background: "#e8f5e9", borderRadius: 4 }}>{success}</div>}

      <form onSubmit={submit} style={{ maxWidth: 420 }}>
        <label style={{ display: "block", marginBottom: 12 }}>
          Email Address
          <br />
          <input
            type="email"
            value={form.email}
            onChange={update("email")}
            placeholder="Enter your email"
            style={{ width: "100%", padding: 10, marginTop: 8, fontSize: 14, border: "1px solid #ccc", borderRadius: 4 }}
            required
          />
        </label>

        {!otpSent ? (
          <button
            type="button"
            onClick={sendOTP}
            style={{
              padding: "10px 20px",
              background: "#1976d2",
              color: "white",
              border: "none",
              cursor: "pointer",
              borderRadius: 4,
              fontSize: 16,
              marginBottom: 12
            }}
            disabled={loading}
          >
            {loading ? "Sending..." : "Send OTP"}
          </button>
        ) : (
          <label style={{ display: "block", marginBottom: 12 }}>
            Enter OTP
            <br />
            <input
              type="text"
              value={form.otp}
              onChange={update("otp")}
              placeholder="6-digit OTP"
              maxLength={6}
              style={{ width: "100%", padding: 10, marginTop: 8, fontSize: 14, border: "1px solid #ccc", borderRadius: 4 }}
              required
            />
          </label>
        )}

        {otpSent && (
          <div style={{ marginTop: 12 }}>
            <button
              type="submit"
              style={{
                padding: "10px 20px",
                background: "#ffd600",
                border: "none",
                cursor: "pointer",
                borderRadius: 4,
                fontSize: 16,
                fontWeight: "bold"
              }}
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </div>
        )}
      </form>

      <p style={{ marginTop: 24, color: "#666" }}>
        Don't have an account? <a href="/supplier/register" style={{ color: "#1976d2", textDecoration: "underline" }}>Register Here</a>
      </p>
    </main>
  );
}
