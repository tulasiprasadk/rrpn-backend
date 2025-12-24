import React, { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "../components/dashboard/Sidebar";
import "./ProfileEditPage.css";

export default function ProfileEditPage() {
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: ""
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // ==============================
  // FETCH PROFILE FROM BACKEND
  // ==============================
  useEffect(() => {
    axios
      .get("http://localhost:5174/api/customer/profile", {
        withCredentials: true
      })
      .then((res) => {
        if (res.data) {
          setProfile(res.data);
        }
      })
      .catch((err) => {
        console.error("Failed to load profile", err);
        setError("Failed to load your profile.");
      });
  }, []);

  // ==============================
  // UPDATE PROFILE
  // ==============================
  const handleSubmit = (e) => {
    e.preventDefault();

    axios
      .put(
        "http://localhost:5174/api/customer/profile",
        profile,
        { withCredentials: true }
      )
      .then(() => {
        setMessage("✔ Profile updated successfully!");
        setError("");
      })
      .catch((err) => {
        console.error("Failed to update profile", err);
        setError("Failed to update profile");
        setMessage("");
      });
  };

  const handleChange = (field, value) => {
    setProfile({ ...profile, [field]: value });
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <div className="dashboard-main">

        <h1 className="profile-title">👤 Edit Profile</h1>

        {message && <div className="success-msg">{message}</div>}
        {error && <div className="error-msg">{error}</div>}

        <div className="profile-form-box">
          <form onSubmit={handleSubmit}>

            <label>Full Name</label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => handleChange("name", e.target.value)}
              required
            />

            <label>Email Address</label>
            <input
              type="email"
              value={profile.email}
              onChange={(e) => handleChange("email", e.target.value)}
              required
            />

            <label>Phone Number</label>
            <input
              type="text"
              value={profile.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              required
              maxLength={10}
            />

            <button type="submit" className="save-profile-btn">
              Save Changes
            </button>

          </form>
        </div>

      </div>
    </div>
  );
}
