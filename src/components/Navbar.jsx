import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "./Navbar.css";
import logo from "../assets/logo.png";

export default function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  // useEffect(() => {
  //   checkLoginStatus();
  // }, [location.pathname]);

  // async function checkLoginStatus() {
  //   try {
  //     const res = await axios.get("/api/auth/me");
  //     if (res.data && res.data.loggedIn) {
  //       const customer = res.data.customer || {};
  //       setIsLoggedIn(true);
  //       setCustomerName(customer.name || customer.mobile || "");
  //     } else {
  //       setIsLoggedIn(false);
  //       setCustomerName("");
  //     }
  //   } catch (err) {
  //     setIsLoggedIn(false);
  //   }
  // }

  async function handleLogout() {
    try {
      await axios.post("/api/auth/logout");
      setIsLoggedIn(false);
      setCustomerName("");
      navigate("/");
    } catch (err) {
      console.error("Logout error:", err);
    }
  }

  return (
    <header className="navbar-wrapper">
      <div className="navbar-top">
        <img src={logo} alt="RR Nagar Logo" className="nav-logo" />
      </div>

      <div className="navbar-bottom">
        <div className="nav-text">RR ನಗರದ ಹತ್ತಿರದ ಡಿಜಿಟಲ್ ಪ್ಲಾಟ್‌ಫಾರ್ಮ್</div>

        <nav className="nav-links">
          {isLoggedIn ? (
            <>
              <Link to="/dashboard">
                <span className="user-name">👤 {customerName}</span>
              </Link>
              <button onClick={handleLogout} className="logout-btn">
                Logout
              </button>
            </>
          ) : (
            <Link to="/login">Login / Register</Link>
          )}
          <Link to="/blog">Blog</Link>
          <Link to="/faq">FAQs</Link>
          <Link to="/contact">Contact</Link>
          <Link to="/help">Help</Link>
        </nav>
      </div>
    </header>
  );
}
