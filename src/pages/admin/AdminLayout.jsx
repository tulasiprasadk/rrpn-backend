import React from "react";
import { Outlet, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../../api/client";
import { API_BASE } from "../../config/api";
import { translate, isKannadaEnabled } from "../../utils/kannadaTranslator";
import "./AdminLayout.css";

// ================== ADMIN NOTIFICATION BELL ==================
function AdminNotifications() {
  const [list, setList] = useState([]);
  const [open, setOpen] = useState(false);

  async function load() {
    try {
      const res = await api.get("/admin/notifications");
      const nextList = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.notifications)
          ? res.data.notifications
          : [];
      setList(nextList);
    } catch (err) {
      console.warn("Notifications load failed:", err?.message || err);
      setList([]);
    }
  }

  useEffect(() => {
    let mounted = true;
    let notifyTimer = null;
    let retryTimer = null;

    const startPolling = () => {
      if (!mounted) return;
      // Immediately load once
      load().catch(() => {});
      // Poll every 15s while backend is available
      notifyTimer = setInterval(() => {
        load().catch(() => {});
      }, 15000);
    };

    const stopPollingAndRetry = () => {
      if (notifyTimer) {
        clearInterval(notifyTimer);
        notifyTimer = null;
      }
      // Poll health every 30s to re-enable notifications when backend returns
      retryTimer = setInterval(async () => {
        try {
          const controller = new AbortController();
          const id = setTimeout(() => controller.abort(), 4000);
          const resp = await fetch(`${API_BASE}/health`, { signal: controller.signal });
          clearTimeout(id);
          if (resp.ok) {
            clearInterval(retryTimer);
            retryTimer = null;
            startPolling();
          }
        } catch (e) {
          // still offline
        }
      }, 30000);
    };

    // Do an initial health check then start polling if OK
    (async () => {
      try {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), 4000);
        const resp = await fetch(`${API_BASE}/health`, { signal: controller.signal });
        clearTimeout(id);
        if (resp.ok) {
          startPolling();
        } else {
          stopPollingAndRetry();
        }
      } catch (e) {
        stopPollingAndRetry();
      }
    })();

    return () => {
      mounted = false;
      if (notifyTimer) clearInterval(notifyTimer);
      if (retryTimer) clearInterval(retryTimer);
    };
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
                try {
                  await api.put("/admin/notifications/mark-read");
                } catch (err) {
                  console.warn("Mark notifications read failed:", err?.message || err);
                }
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
  const [kannadaEnabled, setKannadaEnabled] = useState(isKannadaEnabled());
  const [navOpen, setNavOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await api.post("/admin/logout");
      window.location.href = "/admin/login";
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  return (
    <div className="admin-layout">
      
      {/* LEFT SIDEBAR */}
      <aside className={`admin-sidebar ${navOpen ? "open" : ""}`}>
        <Link to="/" className="admin-logo" style={{ textDecoration: "none", color: "white" }}>
          🎯 RR Nagar Admin
          <div style={{ fontSize: 11, marginTop: 5, opacity: 0.8 }}>← Click to go to main site</div>
        </Link>
        <nav className="admin-nav">

          <Link to="/admin" className="admin-nav-link" onClick={() => setNavOpen(false)}>📊 {translate("Dashboard", kannadaEnabled)}</Link>
          <Link to="/admin/orders" className="admin-nav-link" onClick={() => setNavOpen(false)}>📦 {translate("Orders", kannadaEnabled)}</Link>
          <Link to="/admin/suppliers" className="admin-nav-link" onClick={() => setNavOpen(false)}>🏪 {translate("Suppliers", kannadaEnabled)}</Link>
          <Link to="/admin/products" className="admin-nav-link" onClick={() => setNavOpen(false)}>📦 {translate("Products", kannadaEnabled)}</Link>
          <Link to="/admin/translator" className="admin-nav-link" onClick={() => setNavOpen(false)}>🌐 {translate("Translator", kannadaEnabled)}</Link>
          <Link to="/admin/config" className="admin-nav-link" onClick={() => setNavOpen(false)}>⚙️ {translate("Platform Config", kannadaEnabled)}</Link>
          <Link to="/admin/checkout-marketing" className="admin-nav-link" onClick={() => setNavOpen(false)}>💸 {translate("Offers", kannadaEnabled)}</Link>
          <Link to="/admin/admins" className="admin-nav-link" onClick={() => setNavOpen(false)}>👥 {translate("Admins", kannadaEnabled)}</Link>
          <Link to="/admin/categories" className="admin-nav-link" onClick={() => setNavOpen(false)}>📂 {translate("Categories", kannadaEnabled)}</Link>
          <Link to="/admin/varieties" className="admin-nav-link" onClick={() => setNavOpen(false)}>🌾 {translate("Varieties", kannadaEnabled)}</Link>
          <Link to="/admin/ads" className="admin-nav-link" onClick={() => setNavOpen(false)}>📢 {translate("Advertisements", kannadaEnabled)}</Link>
          <Link to="/admin/change-password" className="admin-nav-link" onClick={() => setNavOpen(false)}>🔐 {translate("Change Password", kannadaEnabled)}</Link>
          
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
            🚪 {translate("Logout", kannadaEnabled)}
          </button>
        </nav>
      </aside>
      {navOpen && <div className="admin-sidebar-backdrop" onClick={() => setNavOpen(false)} />}

      {/* MAIN AREA */}
      <div className="admin-main">
        
        {/* HEADER */}
        <header className="admin-topbar">
          <div className="admin-topbar-left">
            <button
              className="admin-menu-btn"
              onClick={() => setNavOpen(!navOpen)}
              aria-label="Toggle navigation"
            >
              ☰
            </button>
            <Link to="/" className="admin-nav-link" style={{ 
              textDecoration: "none", 
              color: "#e31e24", 
              fontWeight: "bold"
            }}>
              ← Back to Home
            </Link>
          </div>
          <button
            onClick={() => {
              const next = !kannadaEnabled;
              if (next) {
                localStorage.setItem("admin_language", "kannada");
              } else {
                localStorage.removeItem("admin_language");
              }
              setKannadaEnabled(next);
            }}
            style={{
              marginLeft: "auto",
              marginRight: 12,
              padding: "6px 10px",
              borderRadius: 6,
              border: "1px solid #ddd",
              background: "#fff",
              cursor: "pointer",
              fontSize: 12
            }}
          >
            {kannadaEnabled ? "English" : "Kannada"}
          </button>
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



