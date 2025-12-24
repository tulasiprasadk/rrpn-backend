import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminLogin.css";

const AdminLogin = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Invalid credentials");
        return;
      }

      // Session is set on backend, just navigate
      navigate("/admin");
    } catch (err) {
      setError("Server error. Try again.");
    }
  };

  return (
    <div className="admin-login-container">
      <form className="admin-login-box" onSubmit={handleSubmit}>
        <h2>Admin Login</h2>

        {error && <div className="admin-error">{error}</div>}

        <label>Email</label>
        <input
          required
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
        />

        <label>Password</label>
        <input
          required
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
        />

        <button type="submit" className="admin-login-btn">
          Login
        </button>
      </form>
    </div>
  );
};

export default AdminLogin;
