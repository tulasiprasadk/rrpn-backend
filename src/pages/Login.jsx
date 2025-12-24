// frontend/src/pages/Login.jsx

import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../api/client";

export default function Login() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!email) {
      alert("Please enter an email address");
      return;
    }
    // Go directly to verify page, which now logs in with just email
    navigate("/verify", { state: { email } });
  };

  return (
    <div style={{ padding: "30px" }}>
      <h2>Login with Email</h2>

      <input
        type="email"
        value={email}
        placeholder="Enter email address"
        onChange={(e) => setEmail(e.target.value)}
        style={{
          padding: "8px",
          width: "250px",
          marginTop: "10px",
          display: "block",
        }}
      />

      <button
        onClick={handleLogin}
        style={{
          marginTop: "15px",
          padding: "10px 20px",
          background: "#007bff",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        Login
      </button>
    </div>
  );
}
