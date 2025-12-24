import React, { useState } from "react";

export default function PartnerUs() {
  const [form, setForm] = useState({ name: "", phone: "", email: "", message: "" });
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  function update(field) {
    return (e) => setForm({ ...form, [field]: e.target.value });
  }

  function validate() {
    if (!form.name.trim()) return "Please enter your name.";
    if (!form.phone.trim()) return "Please enter a phone number.";
    if (!form.email.trim()) return "Please enter an email.";
    if (!form.message.trim()) return "Please enter a short message about partnering.";
    return null;
  }

  function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    // Placeholder: replace with API call to submit partnership requests
    setSent(true);
  }

  if (sent) {
    return (
      <main style={{ padding: 24, maxWidth: 680 }}>
        <h1>Thanks — we received your request</h1>
        <p>We will contact you shortly on the phone or email you provided.</p>
      </main>
    );
  }

  return (
    <main style={{ padding: 24, maxWidth: 680 }}>
      <h1>Partner With Us</h1>
      <p>Fill the form below to tell us about your business and how you'd like to partner.</p>

      <form onSubmit={handleSubmit} style={{ marginTop: 12 }}>
        <div style={{ marginBottom: 8 }}>
          <label>
            Name
            <br />
            <input type="text" value={form.name} onChange={update("name")} style={inputStyle} />
          </label>
        </div>

        <div style={{ marginBottom: 8 }}>
          <label>
            Phone
            <br />
            <input type="tel" value={form.phone} onChange={update("phone")} style={inputStyle} />
          </label>
        </div>

        <div style={{ marginBottom: 8 }}>
          <label>
            Email
            <br />
            <input type="email" value={form.email} onChange={update("email")} style={inputStyle} />
          </label>
        </div>

        <div style={{ marginBottom: 8 }}>
          <label>
            Message
            <br />
            <textarea value={form.message} onChange={update("message")} style={{ ...inputStyle, minHeight: 120 }} />
          </label>
        </div>

        {error && <div style={{ color: "#ffb4b4", marginBottom: 8 }}>{error}</div>}

        <button type="submit" style={{ padding: "8px 14px", background: "#ffd600", border: "none", cursor: "pointer" }}>
          Send Request
        </button>
      </form>
    </main>
  );
}

/* inline style object reused to keep component self-contained */
const inputStyle = {
  width: "100%",
  padding: 8,
  boxSizing: "border-box",
  borderRadius: 6,
  border: "1px solid #ccc",
};
