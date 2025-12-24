import React from "react";
import { Outlet, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import "./AdminLayout.css";

// ================== ADMIN NOTIFICATION BELL ==================
function AdminNotifications() {
  const [list, setList] = useState([]);
  const [open, setOpen] = useState(false);

  async function load() {
    const res = await axios.get("/api/admin/notifications");
    setList(res.data);
  }

  useEffect(() => {
    load();
    const timer = setInterval(load, 15000);
    return () => clearInterval(timer);
  }, []);

  const unread = list.length;

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          padding: "8px",
          fontSize: 22,
          background: "transparent",
          border: "none",
          cursor: "pointer"
        }}
      >
        🔔
        {unread > 0 && (
          <span
            style={{
              position: "absolute",
              top: -2,
              right: -2,
              background: "red",
              color: "white",
              borderRadius: "50%",
              padding: "2px 6px",
              fontSize: 12
            }}
          >
            {unread}
          </span>
        )}
      </button>

      {/* DROPDOWN */}
      {open && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: 35,
            width: 300,
            background: "white",
            border: "1px solid #ddd",
            borderRadius: 8,
            padding: 10,
            zIndex: 999
          }}
        >
          <h4 style={{ marginTop: 0 }}>Notifications</h4>

          {list.length === 0 && <p>No new alerts</p>}

          {list.map((n) => (
            <div
              key={n.id}
              style={{
                padding: "8px 0",
                borderBottom: "1px solid #eee",
                cursor: n.type === 'supplier_registration' ? 'pointer' : 'default'
              }}
              onClick={() => {
                if (n.type === 'supplier_registration') {
                  setOpen(false);
                  window.location.href = '/admin/suppliers';
                }
              }}
            >
              <strong>{n.title}</strong>
              <p style={{ margin: "3px 0", fontSize: 13 }}>{n.message}</p>
              {n.type === 'supplier_registration' && (
                <p style={{ margin: "3px 0", fontSize: 12, color: "#007bff" }}>
                  → Click to view and approve
                </p>
              )}
            </div>
          ))}

          {list.length > 0 && (
            <button
              onClick={async () => {
                await axios.put("/api/admin/notifications/mark-read");
                setList([]);
              }}
              style={{
                marginTop: 8,
                padding: "8px 12px",
                background: "#007bff",
                color: "white",
                border: "none",
                borderRadius: 5
              }}
            >
              Mark All Read
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ================== ADMIN LAYOUT ==================

export default function AdminLayout() {
  const handleLogout = async () => {
    try {
      await axios.post("http://localhost:4000/api/admin/logout");
      window.location.href = "/admin/login";
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  return (
    <div className="admin-layout">
      
      {/* LEFT SIDEBAR */}
      <aside className="admin-sidebar">
        <Link to="/" className="admin-logo" style={{ textDecoration: "none", color: "white" }}>
          🎯 RR Nagar Admin
          <div style={{ fontSize: 11, marginTop: 5, opacity: 0.8 }}>← Click to go to main site</div>
        </Link>
        <nav className="admin-nav">

          <Link to="/admin" className="admin-nav-link">📊 Dashboard</Link>
          <Link to="/admin/orders" className="admin-nav-link">📦 Orders</Link>
          <Link to="/admin/suppliers" className="admin-nav-link">🏪 Suppliers</Link>
          <Link to="/admin/products" className="admin-nav-link">📦 Products</Link>
          <Link to="/admin/translator" className="admin-nav-link">🌐 Translator</Link>
          <Link to="/admin/categories" className="admin-nav-link">📂 Categories</Link>
          <Link to="/admin/varieties" className="admin-nav-link">🌾 Varieties</Link>
          <Link to="/admin/ads" className="admin-nav-link">📢 Advertisements</Link>
          
          <button 
            onClick={handleLogout} 
            className="admin-nav-link" 
            style={{ 
              background: "#dc3545", 
              color: "white", 
              border: "none", 
              cursor: "pointer",
              marginTop: "auto",
              textAlign: "left"
            }}
          >
            🚪 Logout
          </button>
        </nav>
      </aside>

      {/* MAIN AREA */}
      <div className="admin-main">
        
        {/* HEADER */}
        <header className="admin-topbar">
          <Link to="/" className="admin-nav-link" style={{ 
            textDecoration: "none", 
            color: "#e31e24", 
            fontWeight: "bold"
          }}>
            ← Back to Home
          </Link>
          <AdminNotifications />
        </header>

        {/* PAGE CONTENT */}
        <main className="admin-content" style={{ padding: 20 }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
