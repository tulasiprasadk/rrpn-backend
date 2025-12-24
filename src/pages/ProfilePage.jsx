import React, { useEffect, useState } from "react";
import axios from "axios";
import "./ProfilePage.css";

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const res = await axios.get("/api/customer/profile");
      setProfile(res.data);
    } catch (err) {
      console.error("Profile Load Error:", err);
    }
  }

  if (!profile) return <p className="loading">Loading profile…</p>;

  return (
    <div className="profile-container">

      {/* PROFILE CARD */}
      <div className="profile-card">
        <div className="profile-avatar">
          {profile.name?.charAt(0).toUpperCase() || "U"}
        </div>

        <h2 className="profile-name">{profile.name || "New User"}</h2>
        <p className="profile-mobile">📱 {profile.mobile}</p>
        {profile.email && <p className="profile-email">📧 {profile.email}</p>}
      </div>

      {/* ACTION BUTTONS */}
      <div className="profile-actions">

        <button className="profile-btn yellow"
          onClick={() => (window.location.href = "/profile/edit")}>
          ✏️ Edit Profile
        </button>

        <button className="profile-btn yellow"
          onClick={() => (window.location.href = "/address")}>
          📍 Manage Addresses
        </button>

        <button className="profile-btn yellow"
          onClick={() => (window.location.href = "/my-orders")}>
          📦 My Orders
        </button>

      </div>

    </div>
  );
}
