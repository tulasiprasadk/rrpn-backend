import React, { useEffect, useMemo, useState } from "react";
import api from "../api/client";
import "./ProfilePage.css";

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [orders, setOrders] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    (async () => {
      setLoading(true);
      setError("");
      try {
        const [profileRes, addressRes, ordersRes, subscriptionsRes] = await Promise.all([
          api.get("/customer/profile"),
          api.get("/customer/address").catch(() => ({ data: [] })),
          api.get("/orders").catch(() => ({ data: [] })),
          api.get("/subscriptions").catch(() => ({ data: [] }))
        ]);

        if (!mounted) return;

        setProfile(profileRes.data || null);
        setAddresses(Array.isArray(addressRes.data) ? addressRes.data : []);
        setOrders(Array.isArray(ordersRes.data) ? ordersRes.data : []);
        setSubscriptions(Array.isArray(subscriptionsRes.data) ? subscriptionsRes.data : []);
      } catch (err) {
        console.error("Profile Load Error:", err);
        if (mounted) {
          setError(err.response?.data?.error || "Failed to load profile");
          setProfile(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const summary = useMemo(() => {
    const activeSubscriptions = subscriptions.filter((item) => item.status === "active");
    const completed = [];
    const pending = [];

    const checklist = [
      {
        done: Boolean(profile?.name?.trim()),
        completeLabel: `Name added: ${profile?.name}`,
        pendingLabel: "Add your full name"
      },
      {
        done: Boolean(profile?.email?.trim()),
        completeLabel: `Email added: ${profile?.email}`,
        pendingLabel: "Add your email address"
      },
      {
        done: Boolean(profile?.mobile?.trim() || profile?.username?.trim()),
        completeLabel: `Phone linked: ${profile?.mobile || profile?.username}`,
        pendingLabel: "Add your mobile number"
      },
      {
        done: addresses.length > 0,
        completeLabel: `${addresses.length} saved address${addresses.length === 1 ? "" : "es"}`,
        pendingLabel: "Save at least one delivery address"
      },
      {
        done: orders.length > 0,
        completeLabel: `${orders.length} order${orders.length === 1 ? "" : "s"} placed`,
        pendingLabel: "Place your first order"
      },
      {
        done: activeSubscriptions.length > 0,
        completeLabel: `${activeSubscriptions.length} active subscription${activeSubscriptions.length === 1 ? "" : "s"}`,
        pendingLabel: "Start a subscription for recurring delivery"
      }
    ];

    checklist.forEach((item) => {
      if (item.done) {
        completed.push(item.completeLabel);
      } else {
        pending.push(item.pendingLabel);
      }
    });

    const percent = Math.round((completed.length / checklist.length) * 100);

    return {
      completed,
      pending,
      percent
    };
  }, [profile, addresses, orders, subscriptions]);

  if (loading) {
    return <p className="loading">Loading profile...</p>;
  }

  if (error) {
    return (
      <div className="profile-container">
        <div className="profile-card">
          <h2 className="profile-name">My Profile</h2>
          <p className="profile-email" style={{ color: "#C8102E" }}>{error}</p>
          <button className="profile-btn yellow" onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container" style={{ maxWidth: 980, textAlign: "left" }}>
      <div className="profile-card" style={{ textAlign: "center" }}>
        <div className="profile-avatar">
          {profile?.name?.charAt(0).toUpperCase() || profile?.email?.charAt(0).toUpperCase() || "U"}
        </div>

        <h2 className="profile-name">{profile?.name || "Complete your profile"}</h2>
        <p className="profile-mobile">Phone: {profile?.mobile || profile?.username || "Not added yet"}</p>
        <p className="profile-email">Email: {profile?.email || "Not added yet"}</p>

        <div
          style={{
            marginTop: 18,
            display: "inline-flex",
            padding: "10px 16px",
            borderRadius: 999,
            background: "#fff6b3",
            border: "2px solid #c8102e",
            fontWeight: 800,
            color: "#7a2034"
          }}
        >
          Profile completion: {summary.percent}%
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 18, marginTop: 24 }}>
        <div
          style={{
            background: "#fffaf0",
            borderRadius: 14,
            border: "1px solid #f2d060",
            padding: 20,
            boxShadow: "0 5px 12px rgb(0 0 0 / 8%)"
          }}
        >
          <h3 style={{ marginTop: 0, color: "#166534" }}>Completed</h3>
          {summary.completed.length === 0 ? (
            <p style={{ marginBottom: 0 }}>Nothing completed yet.</p>
          ) : (
            <ul style={{ paddingLeft: 18, marginBottom: 0 }}>
              {summary.completed.map((item) => (
                <li key={item} style={{ marginBottom: 8 }}>{item}</li>
              ))}
            </ul>
          )}
        </div>

        <div
          style={{
            background: "#fffaf0",
            borderRadius: 14,
            border: "1px solid #f2d060",
            padding: 20,
            boxShadow: "0 5px 12px rgb(0 0 0 / 8%)"
          }}
        >
          <h3 style={{ marginTop: 0, color: "#9a3412" }}>Pending</h3>
          {summary.pending.length === 0 ? (
            <p style={{ marginBottom: 0 }}>Everything important is completed.</p>
          ) : (
            <ul style={{ paddingLeft: 18, marginBottom: 0 }}>
              {summary.pending.map((item) => (
                <li key={item} style={{ marginBottom: 8 }}>{item}</li>
              ))}
            </ul>
          )}
        </div>

        <div
          style={{
            background: "#fffaf0",
            borderRadius: 14,
            border: "1px solid #f2d060",
            padding: 20,
            boxShadow: "0 5px 12px rgb(0 0 0 / 8%)"
          }}
        >
          <h3 style={{ marginTop: 0, color: "#5A3A00" }}>Quick Summary</h3>
          <div style={{ display: "grid", gap: 10 }}>
            <div><strong>Addresses:</strong> {addresses.length}</div>
            <div><strong>Orders:</strong> {orders.length}</div>
            <div><strong>Subscriptions:</strong> {subscriptions.length}</div>
            <div><strong>Active subscriptions:</strong> {subscriptions.filter((item) => item.status === "active").length}</div>
          </div>
        </div>
      </div>

      <div className="profile-actions">
        <button className="profile-btn yellow" onClick={() => (window.location.href = "/profile/edit")}>
          Edit Profile
        </button>

        <button className="profile-btn yellow" onClick={() => (window.location.href = "/address")}>
          Manage Addresses
        </button>

        <button className="profile-btn yellow" onClick={() => (window.location.href = "/subscriptions")}>
          View Subscriptions
        </button>

        <button className="profile-btn yellow" onClick={() => (window.location.href = "/my-orders")}>
          My Orders
        </button>
      </div>
    </div>
  );
}
