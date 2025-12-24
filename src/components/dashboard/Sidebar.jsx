import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FiMenu,
  FiX,
  FiHome,
  FiPackage,
  FiHeart,
  FiMapPin,
  FiCreditCard,
  FiUser,
  FiLogOut
} from "react-icons/fi";
import "./Sidebar.css";

export default function Sidebar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Hamburger Button — mobile only */}
      <button className="sidebar-hamburger" onClick={() => setOpen(true)}>
        <FiMenu size={22} />
      </button>

      {/* Dark Overlay when sidebar is open (mobile) */}
      {open && <div className="sidebar-overlay" onClick={() => setOpen(false)} />}

      {/* Sidebar */}
      <aside className={`sidebar ${open ? "open" : ""}`}>

        {/* Close Button — mobile */}
        <div className="sidebar-close" onClick={() => setOpen(false)}>
          <FiX size={22} />
        </div>

        {/* Profile Section */}
        <div className="sidebar-profile">
          <img src="/user-avatar.png" alt="User" className="sidebar-avatar" />
          <h3 className="sidebar-username">Prasad</h3>
        </div>

        {/* Menu Items */}
        <nav className="sidebar-menu">
          <Link to="/dashboard" className={isActive("/dashboard") ? "active" : ""}>
            <FiHome /> Dashboard
          </Link>

          <Link to="/my-orders" className={isActive("/my-orders") ? "active" : ""}>
            <FiPackage /> My Orders
          </Link>

          <Link to="/saved-shops" className={isActive("/saved-shops") ? "active" : ""}>
            <FiHeart /> Saved Shops
          </Link>

          <Link to="/address" className={isActive("/address") ? "active" : ""}>
            <FiMapPin /> My Addresses
          </Link>

          <Link to="/payments" className={isActive("/payments") ? "active" : ""}>
            <FiCreditCard /> Payment History
          </Link>

          <Link to="/profile" className={isActive("/profile") ? "active" : ""}>
            <FiUser /> My Profile
          </Link>

          <button className="logout-btn">
            <FiLogOut /> Logout
          </button>
        </nav>
      </aside>
    </>
  );
}
