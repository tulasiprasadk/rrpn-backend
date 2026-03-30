import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { API_BASE } from "../config/api";
import "../components/dashboard/StatCard.css";
import "../components/dashboard/ProfileCard.css";
import "../components/dashboard/OrdersPreview.css";
import "../components/dashboard/SavedShopsPreview.css";
import "./CustomerDashboard.css";

import StatCard from "../components/dashboard/StatCard";
import ProfileCard from "../components/dashboard/ProfileCard";
import OrdersPreview from "../components/dashboard/OrdersPreview";
import SavedShopsPreview from "../components/dashboard/SavedShopsPreview";
import SubscriptionPrompt from "../components/SubscriptionPrompt";
import CustomerSubscriptionsPanel from "../components/customer/CustomerSubscriptionsPanel";

const CustomerDashboard = () => {
  const { user, login } = useAuth();
  const [stats, setStats] = useState({
    orders: 0,
    savedShops: 0,
    profileComplete: "80%"
  });

  useEffect(() => {
    if (!user) {
      const token = localStorage.getItem("token");
      if (token) {
        axios
          .get(`${API_BASE}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
          .then((res) => {
            if (res.data && res.data.loggedIn && res.data.customer) {
              login(res.data.customer, token);
            }
          })
          .catch(() => {});
      }
    }
  }, [user, login]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

      try {
        const [ordersRes, savedSuppliersRes, addressesRes] = await Promise.all([
          axios.get(`${API_BASE}/orders`, { headers }).catch(() => ({ data: [] })),
          axios.get(`${API_BASE}/customer/saved-suppliers`, { headers }).catch(() => ({ data: [] })),
          axios.get(`${API_BASE}/customer/address`, { headers }).catch(() => ({ data: [] }))
        ]);

        if (!mounted) return;

        const orders = Array.isArray(ordersRes.data) ? ordersRes.data : [];
        const savedSuppliers = Array.isArray(savedSuppliersRes.data) ? savedSuppliersRes.data : [];
        const addresses = Array.isArray(addressesRes.data) ? addressesRes.data : [];
        const profileBits = [
          user?.name,
          user?.email || user?.phone,
          addresses.length > 0
        ].filter(Boolean).length;

        setStats({
          orders: orders.length,
          savedShops: savedSuppliers.length,
          profileComplete: `${Math.min(100, Math.round((profileBits / 3) * 100))}%`
        });
      } catch (err) {
        console.error("Customer dashboard stats load failed:", err);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [user]);

  return (
    <div className="customer-dashboard" style={{ minHeight: "70vh" }}>
      <h2>Welcome to your Dashboard!</h2>

      <SubscriptionPrompt compact />
      <CustomerSubscriptionsPanel compact />

      <div className="cd-search" style={{ margin: "24px 0", display: "flex", alignItems: "center" }}>
        <input
          type="text"
          placeholder="Search for products, varieties..."
          style={{ padding: 8, fontSize: 16, width: 320, marginRight: 12 }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              window.location.href = `/browse?q=${encodeURIComponent(e.target.value)}`;
            }
          }}
        />
        <button
          style={{ padding: "8px 18px", fontSize: 16 }}
          onClick={(e) => {
            const input = e.target.previousSibling;
            if (input && input.value) {
              window.location.href = `/browse?q=${encodeURIComponent(input.value)}`;
            }
          }}
        >
          Search
        </button>
      </div>

      <div className="cd-stats" style={{ display: "flex", gap: "1rem", marginBottom: "2rem" }}>
        <StatCard label="Orders" value={stats.orders} icon={<span>🧾</span>} color="#4f46e5" />
        <StatCard label="Saved Shops" value={stats.savedShops} icon={<span>🏪</span>} color="#059669" />
        <StatCard label="Profile Complete" value={stats.profileComplete} icon={<span>✅</span>} color="#f59e0b" />
      </div>

      <div className="cd-panels" style={{ display: "flex", gap: "2rem" }}>
        <OrdersPreview />
        <SavedShopsPreview />
      </div>

      <div className="cd-profile" style={{ marginTop: "2rem" }}>
        <ProfileCard />
      </div>
    </div>
  );
};

export default CustomerDashboard;
