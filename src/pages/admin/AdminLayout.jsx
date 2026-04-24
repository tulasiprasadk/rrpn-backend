import React, { useEffect, useState } from "react";
import { Outlet, Link } from "react-router-dom";
import api from "../../api/client";
import { API_BASE } from "../../config/api";
import { translate, isKannadaEnabled } from "../../utils/kannadaTranslator";
import "./AdminLayout.css";

function AdminNotifications() {
  const [list, setList] = useState([]);
  const [open, setOpen] = useState(false);

  function parseMeta(value) {
    if (!value) return null;
    if (typeof value === "object") return value;
    try {
      return JSON.parse(value);
    } catch (_err) {
      return null;
    }
  }

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
      load().catch(() => {});
      notifyTimer = setInterval(() => {
        load().catch(() => {});
      }, 15000);
    };

    const stopPollingAndRetry = () => {
      if (notifyTimer) {
        clearInterval(notifyTimer);
        notifyTimer = null;
      }
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
        } catch (_err) {
          // backend still unavailable
        }
      }, 30000);
    };

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
      } catch (_err) {
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

      {open && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: 35,
            width: 320,
            background: "white",
            border: "1px solid #ddd",
            borderRadius: 8,
            padding: 10,
            zIndex: 999
          }}
        >
          <h4 style={{ marginTop: 0 }}>Notifications</h4>

          {list.length === 0 && <p>No new alerts</p>}

          {list.map((item) => {
            const meta = parseMeta(item.meta);
            const isClickable = ["supplier_registration", "payment_submitted", "order_created"].includes(item.type);

            return (
              <div
                key={item.id}
                style={{
                  padding: "8px 0",
                  borderBottom: "1px solid #eee",
                  cursor: isClickable ? "pointer" : "default"
                }}
                onClick={() => {
                  if (item.type === "supplier_registration") {
                    setOpen(false);
                    window.location.href = "/admin/suppliers";
                  } else if (item.type === "payment_submitted") {
                    setOpen(false);
                    window.location.href = meta?.route || "/admin/orders";
                  } else if (item.type === "order_created") {
                    setOpen(false);
                    window.location.href = meta?.route || "/admin/orders";
                  }
                }}
              >
                <strong>{item.title}</strong>
                <p style={{ margin: "3px 0", fontSize: 13 }}>{item.message}</p>
                {item.type === "supplier_registration" && (
                  <p style={{ margin: "3px 0", fontSize: 12, color: "#007bff" }}>
                    Click to view and approve
                  </p>
                )}
                {item.type === "payment_submitted" && (
                  <p style={{ margin: "3px 0", fontSize: 12, color: "#007bff" }}>
                    Click to review payment and approve
                  </p>
                )}
                {item.type === "order_created" && (
                  <p style={{ margin: "3px 0", fontSize: 12, color: "#007bff" }}>
                    Click to open orders
                  </p>
                )}
              </div>
            );
          })}

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

  const navItems = [
    { to: "/admin", label: "Dashboard", icon: "📊" },
    { to: "/admin/orders", label: "Orders", icon: "📦" },
    { to: "/admin/suppliers", label: "Suppliers", icon: "🏪" },
    { to: "/admin/products", label: "Products", icon: "📦" },
    { to: "/admin/translator", label: "Translator", icon: "🌐" },
    { to: "/admin/analytics", label: "Analytics", icon: "📈" },
    { to: "/admin/config", label: "Platform Config", icon: "⚙️" },
    { to: "/admin/checkout-marketing", label: "Offers", icon: "💸" },
    { to: "/admin/admins", label: "Admins", icon: "👥" },
    { to: "/admin/categories", label: "Categories", icon: "📂" },
    { to: "/admin/varieties", label: "Varieties", icon: "🌾" },
    { to: "/admin/ads", label: "Advertisements", icon: "📢" },
    { to: "/admin/change-password", label: "Change Password", icon: "🔐" }
  ];

  return (
    <div className="admin-layout">
      <aside className={`admin-sidebar ${navOpen ? "open" : ""}`}>
        <Link to="/" className="admin-logo" style={{ textDecoration: "none", color: "white" }}>
          🎯 RR Nagar Admin
          <div style={{ fontSize: 11, marginTop: 5, opacity: 0.8 }}>← Click to go to main site</div>
        </Link>

        <nav className="admin-nav">
          {navItems.map((item) => (
            <Link key={item.to} to={item.to} className="admin-nav-link" onClick={() => setNavOpen(false)}>
              {item.icon} {translate(item.label, kannadaEnabled)}
            </Link>
          ))}
          <Link to="/admin/users" className="admin-nav-link" onClick={() => setNavOpen(false)}>
            ðŸ§‘ {translate("Users", kannadaEnabled)}
          </Link>

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

      <div className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar-left">
            <button
              className="admin-menu-btn"
              onClick={() => setNavOpen(!navOpen)}
              aria-label="Toggle navigation"
            >
              ☰
            </button>
            <Link
              to="/"
              className="admin-nav-link"
              style={{ textDecoration: "none", color: "#e31e24", fontWeight: "bold" }}
            >
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

        <main className="admin-content" style={{ padding: 20 }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
