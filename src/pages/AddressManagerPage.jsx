import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import axios from "axios";
import { API_BASE } from "../api/client";
import GoogleAddressInput from "../components/GoogleAddressInput"; // <-- IMPORTANT

export default function AddressManagerPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const address = location.state || {};

  const [form, setForm] = useState({
    name: address.name || "",
    phone: address.phone || "",
    pincode: address.pincode || "",
    addressLine: address.addressLine || "",
    city: address.city || "",
    state: address.state || "",
    isDefault: address.isDefault || false,
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // -----------------------------
  // Normal input fields
  // -----------------------------
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  // -----------------------------
  // Google Autocomplete Result Handler
  // -----------------------------
  const handleGoogleSelect = (place) => {
    if (!place.address_components) return;

    const find = (t) =>
      place.address_components.find((c) => c.types.includes(t))?.long_name || "";

    const street = `${find("street_number")} ${find("route")}`.trim();

    setForm({
      ...form,
      addressLine: street,
      city: find("locality") || find("sublocality_level_1"),
      state: find("administrative_area_level_1"),
      pincode: find("postal_code"),
    });
  };

  // -----------------------------
  // SAVE ADDRESS
  // -----------------------------
  const save = async () => {
    try {
      setSaving(true);
      setError("");
      
      if (!form.name || !form.phone || !form.addressLine || !form.city) {
        setError("Please fill in all required fields (name, phone, address, city)");
        setSaving(false);
        return;
      }

      let result;
      let newAddressId = null;

      if (address.id) {
        // Updating existing
        console.log("Updating address with ID:", address.id, "Data:", form);
        result = await axios.put(`${API_BASE}/customer/address/${address.id}`, form);
        newAddressId = address.id;
      } else {
        // Creating new
        console.log("Creating new address with data:", form);
        result = await axios.post(`${API_BASE}/customer/address`, form);
        console.log("API response:", result.data);
        newAddressId = result.data?.address?.id;
        console.log("New address ID from API:", newAddressId);
      }

      // Set default if checked
      if (form.isDefault && newAddressId) {
        try {
          await axios.put(`${API_BASE}/customer/address/${newAddressId}/default`);
        } catch (e) {
          console.warn("Could not set default:", e);
        }
      }

      // Success - navigate without alert
      console.log("Address saved successfully, navigating to /address");
      setSaving(false);
      navigate("/address");
    } catch (err) {
      setSaving(false);
      if (err.response?.status === 401) {
        setError("Please log in first");
      } else {
        setError(err.response?.data?.error || err.message || "Failed to save address");
      }
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>{address.id ? "Edit Address" : "Add Address"}</h2>

      {error && (
        <div style={{ color: "crimson", marginBottom: 12, padding: 8, border: "1px solid crimson", borderRadius: 4 }}>
          {error}
        </div>
      )}

      {/* GOOGLE AUTOCOMPLETE */}
      <GoogleAddressInput
        value={form.addressLine}
        onChange={(value) => setForm({ ...form, addressLine: value })}
        onSelect={handleGoogleSelect}
      />

      <input
        name="name"
        placeholder="Name *"
        value={form.name}
        onChange={handleChange}
        style={{ marginTop: 8 }}
      /><br />

      <input
        name="phone"
        placeholder="Phone *"
        value={form.phone}
        onChange={handleChange}
        style={{ marginTop: 8 }}
      /><br />

      <input
        name="pincode"
        placeholder="Pincode"
        value={form.pincode}
        onChange={handleChange}
        style={{ marginTop: 8 }}
      /><br />

      <input
        name="city"
        placeholder="City *"
        value={form.city}
        onChange={handleChange}
        style={{ marginTop: 8 }}
      /><br />

      <input
        name="state"
        placeholder="State"
        value={form.state}
        onChange={handleChange}
        style={{ marginTop: 8 }}
      /><br />

      <label style={{ marginTop: 8 }}>
        <input
          type="checkbox"
          name="isDefault"
          checked={form.isDefault}
          onChange={handleChange}
        />
        Set as Default
      </label>

      <br /><br />
      <button onClick={save} disabled={saving} style={{ padding: "8px 12px" }}>
        {saving ? "Saving..." : "Save"}
      </button>
      <button onClick={() => navigate("/address")} style={{ marginLeft: 8, padding: "8px 12px" }}>
        Cancel
      </button>
    </div>
  );
}
