import React, { useState } from "react";
import axios from "axios";
import "./PartnerModal.css";

export default function PartnerModal({ isOpen, onClose }) {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    message: ""
  });
  const [status, setStatus] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: "", message: "" });

    try {
      // You can create a backend endpoint for this or just log it for now
      await axios.post("/api/partner-inquiry", form);
      setStatus({ 
        type: "success", 
        message: "Thank you! We'll contact you soon about partnership opportunities." 
      });
      setTimeout(() => {
        setForm({ name: "", phone: "", email: "", message: "" });
        onClose();
      }, 2000);
    } catch (err) {
      setStatus({ 
        type: "error", 
        message: "Failed to send. Please try again or email us at namaste@rrnagar.com" 
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="partner-modal-overlay" onClick={onClose}>
      <div className="partner-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="partner-modal-close" onClick={onClose}>×</button>
        
        <h2>Partner With Us</h2>
        <p className="partner-modal-subtitle">
          Let us know how you'd like to collaborate with RR Nagar
        </p>

        {status.message && (
          <div className={`partner-alert partner-alert-${status.type}`}>
            {status.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="partner-form">
          <div className="partner-form-group">
            <label>Name *</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Your full name"
              required
            />
          </div>

          <div className="partner-form-group">
            <label>Phone Number *</label>
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="9876543210"
              required
            />
          </div>

          <div className="partner-form-group">
            <label>Email *</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="your@email.com"
              required
            />
          </div>

          <div className="partner-form-group">
            <label>Message *</label>
            <textarea
              name="message"
              value={form.message}
              onChange={handleChange}
              placeholder="Tell us about your partnership idea..."
              rows="5"
              required
            />
          </div>

          <div className="partner-form-actions">
            <button type="submit" className="partner-btn-submit" disabled={loading}>
              {loading ? "Sending..." : "Send Message"}
            </button>
            <button type="button" className="partner-btn-cancel" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
