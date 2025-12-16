// frontend/src/components/Header.jsx
import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
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
  .get(
    import.meta.env.DEV
      ? `${import.meta.env.VITE_API_URL}/api/auth/me`
      : "/api/auth/me",
    { withCredentials: true }
  )

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
      await axios.post("/api/auth/logout", {}, { withCredentials: true });
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

        <div className="rn-logo-wrap">
          <Link to="/" className="rn-logo-link">
            <img src={logo} alt="RR Nagar" className="rn-logo" />
            <div className="rn-subtitle">RR ನಗರದ ಹೊಸ ಡಿಜಿಟಲ್ ಅನುಭವ</div>
          </Link>
        </div>

        <nav className="rn-nav">
          <Link className="rn-nav-item" to="/">Home</Link>

          <Link className="rn-nav-item cart-link" to="/cart">
            🛒 Cart
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
