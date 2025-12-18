// frontend/src/components/Header.jsx
import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { API_BASE } from "../api/client";
import "./Header.css";

// ✅ IMPORT LOGO (Vite will resolve correct path)
import logo from "../assets/logo.png";

export default function Header() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // prevent UI flashing
  const [cartCount, setCartCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  const updateCartCount = () => {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    setCartCount(count);
  };

  useEffect(() => {
    let isMounted = true;

    axios
      .get(`${API_BASE}/auth/me`, { withCredentials: true })

      .then((res) => {
        if (!isMounted) return;

        if (res.data && res.data.loggedIn) {
          setUser(res.data.customer || null);
        } else {
          setUser(null);
        }
      })
      .catch(() => {
        // API call failed (e.g., no backend available) - show login link
        if (!isMounted) return;
        setUser(null);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    updateCartCount();
    const interval = setInterval(updateCartCount, 1000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await axios.post(`${API_BASE}/auth/logout`, {}, { withCredentials: true });
      setUser(null);
      navigate("/");
    } catch (err) {
      console.error("Logout error:", err);
      setUser(null);
      navigate("/");
    }
  };

  return (
    <header className="rn-header">
      <div className="rn-topbar">

        <div className="rn-logo-wrap" style={{ marginTop: 0, paddingTop: 0 }}>
          <Link to="/" className="rn-logo-link" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textDecoration: 'none', marginTop: 0, paddingTop: 0 }}>
            <img src={logo} alt="RR Nagar" className="rn-logo" style={{ marginTop: 0, paddingTop: 0, height: 72, width: 'auto', maxWidth: 180 }} />
            <div style={{ fontWeight: 700, fontSize: 16, color: '#333', marginTop: 4, lineHeight: 1 }}>ತಾಜಾ, ತ್ವರಿತ, ತೃಪ್ತಿಕರ</div>
            <div style={{ fontWeight: 500, fontSize: 12, color: '#C8102E', marginTop: 2, lineHeight: 1 }}>Fresh. Fast. Fulfillment.</div>
          </Link>
        </div>

        <nav className="rn-nav">
          <Link className="rn-nav-item" to="/">Home</Link>

          <Link className="rn-nav-item cart-link" to="/cart">
            Bag
            {cartCount > 0 && (
              <span className="cart-badge">{cartCount}</span>
            )}
          </Link>

          {!loading && !user && (
            <Link className="rn-nav-item" to="/login">Login</Link>
          )}

          {!loading && user && (
            <>
              <Link className="rn-nav-item" to="/dashboard">Dashboard</Link>
              <button className="rn-nav-logout" onClick={handleLogout}>
                Logout
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
