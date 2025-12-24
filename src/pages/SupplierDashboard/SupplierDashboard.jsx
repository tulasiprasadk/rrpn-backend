import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./SupplierDashboard.css";

export default function SupplierDashboard() {
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    todayOrders: 0,
    pending: 0,
    delivered: 0,
    revenueToday: 0,
  });

  const [loading, setLoading] = useState(true);

  // Fetch dashboard stats from backend
  useEffect(() => {
    const loadStats = async () => {
      try {
        const res = await fetch("/supplier/dashboard");
        const data = await res.json();

        if (res.ok) {
          setStats(data);
        }
      } catch (err) {
        console.error("Dashboard load error:", err);
      }

      setLoading(false);
    };

    loadStats();
  }, []);

  if (loading) {
    return <div className="sd-loading">Loading dashboard...</div>;
  }

  return (
    <div className="sd-container">
      <h1>Supplier Dashboard</h1>

      {/* DASHBOARD CARDS */}
      <div className="sd-cards">
        <div className="sd-card">
          <h2>{stats.todayOrders}</h2>
          <p>Today's Orders</p>
        </div>

        <div className="sd-card">
          <h2>{stats.pending}</h2>
          <p>Pending Orders</p>
        </div>

        <div className="sd-card">
          <h2>{stats.delivered}</h2>
          <p>Delivered</p>
        </div>

        <div className="sd-card revenue">
          <h2>₹ {stats.revenueToday}</h2>
          <p>Revenue Today</p>
        </div>
      </div>

      {/* ACTION BUTTONS */}
      <div className="sd-actions">
        <button onClick={() => navigate("/supplier/orders")}>
          View Orders
        </button>

        <button onClick={() => navigate("/supplier/products")}>
          Manage Products
        </button>

        <button onClick={() => navigate("/supplier/products/add")}>
          Add New Product
        </button>
      </div>
    </div>
  );
}
