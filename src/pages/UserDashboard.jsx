import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./UserDashboard.css";

export default function UserDashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [stats, setStats] = useState({
    orders: 0,
    saved: 0,
    addresses: 0,
  });
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const reqConfig = { withCredentials: true };

    try {
      const profileRes = await axios.get("/api/customer/profile", reqConfig);
      setProfile(profileRes.data);
    } catch (err) {
      console.log("Dashboard profile load error:", err);
      return;
    }

    const [statsRes, ordersRes, addressRes, suppliersRes] = await Promise.all([
      axios
        .get("/api/customer/dashboard-stats", reqConfig)
        .catch((err) => {
          console.warn("Dashboard stats load error:", err);
          return { data: { orders: 0, saved: 0, addresses: 0 } };
        }),
      axios
        .get("/api/orders", reqConfig)
        .catch((err) => {
          console.warn("Dashboard orders load error:", err);
          return { data: [] };
        }),
      axios
        .get("/api/customer/address", reqConfig)
        .catch((err) => {
          console.warn("Dashboard address load error:", err);
          return { data: [] };
        }),
      axios
        .get("/api/customer/saved-suppliers", reqConfig)
        .catch((err) => {
          console.warn("Dashboard suppliers load error:", err);
          return { data: [] };
        })
    ]);

    setStats(statsRes.data || { orders: 0, saved: 0, addresses: 0 });
    setOrders(ordersRes.data || []);
    setAddresses(addressRes.data || []);
    setSuppliers(suppliersRes.data || []);
  }

  const downloadInvoice = async (orderId) => {
    try {
      const response = await axios.get(`/api/orders/${orderId}/invoice`, {
        responseType: 'blob',
        withCredentials: true
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Invoice-${orderId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentElement.removeChild(link);
    } catch (err) {
      console.error('Invoice download error:', err);
      alert('Failed to download invoice');
    }
  };

  if (!profile) return <p className="loading">Loading dashboard...</p>;

  return (
    <div className="dash-container">

      {/* WELCOME BOX */}
      <div className="dash-welcome">
        <h2 className="welcome-name">👋 Welcome, {profile.name || "Customer"}</h2>
        <p className="welcome-phone">📱 Mobile: {profile.mobile}</p>
        {profile.email && <p className="welcome-email">📧 Email: {profile.email}</p>}
      </div>

      {/* 4 MAIN STAT CARDS */}
      <div className="dash-cards">

        <div className="dash-card" onClick={() => setActiveTab("orders")}>
          <div className="card-number">{stats.orders}</div>
          <div className="card-label">My Orders</div>
        </div>

        <div className="dash-card" onClick={() => setActiveTab("suppliers")}>
          <div className="card-number">{stats.saved}</div>
          <div className="card-label">Regular Shops</div>
        </div>

        <div className="dash-card" onClick={() => setActiveTab("addresses")}>
          <div className="card-number">{stats.addresses}</div>
          <div className="card-label">Addresses</div>
        </div>

        <div className="dash-card" onClick={() => navigate("/profile")}>
          <div className="card-label">👤 My Profile</div>
        </div>

      </div>

      {/* TAB NAVIGATION */}
      <div className="dash-tabs">
        <button 
          className={`tab-btn ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          Overview
        </button>
        <button 
          className={`tab-btn ${activeTab === "orders" ? "active" : ""}`}
          onClick={() => setActiveTab("orders")}
        >
          Orders & Invoices
        </button>
        <button 
          className={`tab-btn ${activeTab === "suppliers" ? "active" : ""}`}
          onClick={() => setActiveTab("suppliers")}
        >
          Regular Shops
        </button>
        <button 
          className={`tab-btn ${activeTab === "addresses" ? "active" : ""}`}
          onClick={() => setActiveTab("addresses")}
        >
          Addresses
        </button>
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === "overview" && (
        <>
          {/* RECENT ORDERS SECTION */}
          <div className="dash-section">
            <div className="section-header">
              <h3>📦 Recent Orders</h3>
              <button onClick={() => setActiveTab("orders")} className="view-all-btn">View All</button>
            </div>
            {orders.length === 0 ? (
              <p className="empty-message">No orders yet</p>
            ) : (
              <div className="orders-list">
                {orders.slice(0, 5).map(order => (
                  <div key={order.id} className="order-item" onClick={() => navigate(`/my-orders/${order.id}`)}>
                    <div className="order-info">
                      <span className="order-id">Order #{order.id}</span>
                      <span className="order-date">{new Date(order.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="order-details">
                      <span className="order-amount">₹{order.totalAmount}</span>
                      <span className={`order-status status-${order.status}`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ADDRESSES SECTION */}
          <div className="dash-section">
            <div className="section-header">
              <h3>📍 My Addresses</h3>
              <button onClick={() => setActiveTab("addresses")} className="view-all-btn">Manage</button>
            </div>
            {addresses.length === 0 ? (
              <p className="empty-message">No addresses saved</p>
            ) : (
              <div className="addresses-list">
                {addresses.slice(0, 3).map(addr => (
                  <div key={addr.id} className="address-item">
                    <div className="address-label">{addr.label || "Home"} {addr.isDefault && <span className="default-badge">Default</span>}</div>
                    <div className="address-text">{addr.addressLine}</div>
                    <div className="address-subtext">{addr.city}, {addr.state} {addr.pincode}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* ORDERS & INVOICES TAB */}
      {activeTab === "orders" && (
        <div className="dash-section">
          <h3>📦 All Orders</h3>
          {orders.length === 0 ? (
            <p className="empty-message">No orders yet. <button onClick={() => navigate("/")} className="link-btn">Start Shopping</button></p>
          ) : (
            <div className="orders-detailed-list">
              {orders.map(order => (
                <div key={order.id} className="order-detailed-item">
                  <div className="order-header">
                    <div>
                      <h4>Order #{order.id}</h4>
                      <p className="order-date">{new Date(order.createdAt).toLocaleDateString('en-IN', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}</p>
                    </div>
                    <div className="order-status-section">
                      <span className={`badge status-${order.status}`}>{order.status}</span>
                      <span className={`badge payment-${order.paymentStatus}`}>{order.paymentStatus}</span>
                    </div>
                  </div>
                  
                  <div className="order-body">
                    {order.Product && (
                      <div className="order-product">
                        <img 
                          src={order.Product?.image || "https://via.placeholder.com/80"} 
                          alt={order.Product?.title ? `Product image of ${order.Product.title}` : 'Product image'}
                          className="product-img"
                        />
                        <div className="product-info">
                          <h5>{order.Product?.title || "Product"}</h5>
                          <p className="product-price">₹{order.totalAmount}</p>
                        </div>
                      </div>
                    )}
                    
                    <div className="order-meta">
                      <p><strong>Address:</strong> {order.customerAddress || "Not specified"}</p>
                      <p><strong>Type:</strong> {order.type || "Delivery"}</p>
                    </div>
                  </div>

                  <div className="order-actions">
                    <button 
                      onClick={() => navigate(`/my-orders/${order.id}`)}
                      className="btn-secondary"
                    >
                      View Details
                    </button>
                    <button 
                      onClick={() => downloadInvoice(order.id)}
                      className="btn-primary"
                      title="Download invoice as PDF"
                    >
                      📄 Download Invoice
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* REGULAR SHOPS/SUPPLIERS TAB */}
      {activeTab === "suppliers" && (
        <div className="dash-section">
          <h3>🏪 Regular Shops</h3>
          {suppliers.length === 0 ? (
            <p className="empty-message">No saved shops yet. <button onClick={() => navigate("/products")} className="link-btn">Browse Shops</button></p>
          ) : (
            <div className="suppliers-grid">
              {suppliers.map(supplier => (
                <div key={supplier.id} className="supplier-card">
                  <div className="supplier-header">
                    <h4>{supplier.shopName}</h4>
                    {supplier.rating && <span className="rating">⭐ {supplier.rating}</span>}
                  </div>
                  <p className="supplier-location">{supplier.location || "Location not specified"}</p>
                  <p className="supplier-contact">📞 {supplier.phoneNumber}</p>
                  {supplier.description && <p className="supplier-desc">{supplier.description}</p>}
                  <button 
                    onClick={() => navigate(`/shops/${supplier.id}`)}
                    className="btn-secondary"
                  >
                    View Shop
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ADDRESSES TAB */}
      {activeTab === "addresses" && (
        <div className="dash-section">
          <div className="section-header">
            <h3>📍 Manage Addresses</h3>
            <button onClick={() => navigate("/address")} className="btn-primary">+ Add New Address</button>
          </div>
          {addresses.length === 0 ? (
            <p className="empty-message">No addresses saved yet.</p>
          ) : (
            <div className="addresses-grid">
              {addresses.map(addr => (
                <div key={addr.id} className="address-card">
                  <div className="address-header">
                    <h4>{addr.label || "Home"}</h4>
                    {addr.isDefault && <span className="default-badge">Default</span>}
                  </div>
                  <div className="address-content">
                    <p><strong>{addr.name}</strong></p>
                    <p>{addr.addressLine}</p>
                    <p>{addr.city}, {addr.state} - {addr.pincode}</p>
                  </div>
                  <div className="address-actions">
                    <button 
                      onClick={() => navigate(`/address/${addr.id}`)}
                      className="btn-secondary"
                    >
                      Edit
                    </button>
                    {!addr.isDefault && (
                      <button 
                        className="btn-secondary"
                        style={{color: '#666'}}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
