import React, { useState } from "react";

/**
 * AddressForm
 * - Collects basic delivery address and landmark
 * - Calls onSave(address) when user submits
 */
export default function AddressForm({ initial = {}, onSave = () => {} }) {
  const [name, setName] = useState(initial.name || "");
  const [phone, setPhone] = useState(initial.phone || "");
  const [line1, setLine1] = useState(initial.line1 || "");
  const [line2, setLine2] = useState(initial.line2 || "");
  const [landmark, setLandmark] = useState(initial.landmark || "");
  const [city, setCity] = useState(initial.city || "");
  const [pincode, setPincode] = useState(initial.pincode || "");
  const [msg, setMsg] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (!line1 || !city) {
      setMsg("Please provide address line 1 and city.");
      return;
    }
    const address = { name, phone, line1, line2, landmark, city, pincode };
    onSave(address);
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: 8, maxWidth: 700 }}>
      <label>
        Full name (recipient)
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
      </label>
      <label>
        Phone
        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Mobile number" />
      </label>
      <label>
        Address line 1
        <input value={line1} onChange={(e) => setLine1(e.target.value)} placeholder="House, building, street" />
      </label>
      <label>
        Address line 2 (optional)
        <input value={line2} onChange={(e) => setLine2(e.target.value)} placeholder="Area, colony, etc." />
      </label>
      <label>
        Landmark
        <input value={landmark} onChange={(e) => setLandmark(e.target.value)} placeholder="Nearby landmark" />
      </label>
      <label>
        City
        <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" />
      </label>
      <label>
        Pincode
        <input value={pincode} onChange={(e) => setPincode(e.target.value)} placeholder="Pincode" />
      </label>

      <div style={{ display: "flex", gap: 8 }}>
        <button type="submit" style={{ padding: "8px 12px" }}>Save & Continue</button>
      </div>
      {msg && <div style={{ color: "crimson" }}>{msg}</div>}
    </form>
  );
}
