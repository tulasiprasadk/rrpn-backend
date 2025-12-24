// frontend/src/components/Header.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./Header.css";
import logo from "../assets/logo.png";

export default function Header() {
  const [bagCount, setBagCount] = useState(0);

  // 🔁 Update bag count from localStorage
  const updateBagCount = () => {
    const bag = JSON.parse(localStorage.getItem("bag") || "[]");
    const count = bag.reduce(
      (sum, item) => sum + (item.quantity || 0),
      0
    );
    setBagCount(count);
  };

  useEffect(() => {
    updateBagCount();
    window.addEventListener("storage", updateBagCount);
    return () => window.removeEventListener("storage", updateBagCount);
  }, []);

  return (
    <header>
      <div className="rn-topbar">
        <div className="rn-logo-wrap">
          <Link to="/" className="rn-logo-link">
            <img src={logo} alt="RR Nagar" className="rn-logo" />
            <div className="rn-subtitle">
              RR ನಗರದ ಹೊಸ ಡಿಜಿಟಲ್ ಅನುಭವ
            </div>
          </Link>
        </div>
        <div className="rn-logo-wrap">
          <Link to="/" className="rn-logo-link">
            <img src={logo} alt="RR Nagar" className="rn-logo" />
            <div className="rn-subtitle">
              RR ನಗರದ ಹೊಸ ಡಿಜಿಟಲ್ ಅನುಭವ
            </div>
>>>>>>> 4e37e52 (Initial commit: working RRnagar frontend)
          </Link>
        </div>

        <nav className="rn-nav">
          <Link className="rn-nav-item" to="/">Home</Link>
          <Link className="rn-nav-item" to="/blog">Blog</Link>

          <Link className="rn-nav-item cart-link" to="/bag">
            🛍️ Bag
            {bagCount > 0 && (
              <span className="cart-badge">{bagCount}</span>
          <Link className="rn-nav-item cart-link" to="/bag">
            🛍️ Bag
            {bagCount > 0 && (
              <span className="cart-badge">{bagCount}</span>
>>>>>>> 4e37e52 (Initial commit: working RRnagar frontend)
            )}
          </Link>

          {/* Auth intentionally disabled for now */}
          <Link className="rn-nav-item" to="/login">Login</Link>
        </nav>
      </div>
    </header>
  );
}
