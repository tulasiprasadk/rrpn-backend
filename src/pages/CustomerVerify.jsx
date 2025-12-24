import { useState } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { API_BASE } from "../api/client";

export default function CustomerVerify() {
  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email || "";
  // const [otp, setOtp] = useState("");
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [address, setAddress] = useState({
    name: "",
    addressLine: "",
    city: "",
    state: "",
    pincode: "",
    isDefault: true
  });

  const handleVerify = async () => {
    try {
      // Call backend with just email (no OTP)
      const res = await axios.post(`${API_BASE}/auth/verify-email-otp`, { email }, { withCredentials: true });

      // Check if user has saved addresses
      try {
        const addressRes = await axios.get(`${API_BASE}/customer/address`, { withCredentials: true });
        if (addressRes.data && addressRes.data.length > 0) {
          navigate("/dashboard");
        } else {
          setShowAddressForm(true);
        }
      } catch (err) {
        if (res.data.isNewUser) {
          setShowAddressForm(true);
        } else {
          navigate("/dashboard");
        }
      }
    } catch (err) {
      console.error(err);
      alert("Login failed");
    }
  };

  const handleAddressSubmit = async () => {
    try {
      if (!address.name || !address.addressLine || !address.city || !address.pincode) {
        alert("Please fill all address fields");
        return;
      }

      console.log("Submitting address:", address);
      
      const response = await axios.post(`${API_BASE}/customer/address`, {
        ...address,
      }, { withCredentials: true });

      console.log("Address saved:", response.data);
      alert("Address saved successfully!");
      
      // Navigate to checkout with the saved address
      const savedAddress = response.data.address || {
        ...address,
        id: response.data.id
      };
      
      navigate("/checkout", { 
        state: { selectedAddress: savedAddress } 
      });

    } catch (err) {
      console.error("Address save error:", err);
      alert("Failed to save address: " + (err.response?.data?.error || err.message));
    }
  };

  if (showAddressForm) {
    return (
      <div style={{ padding: 30, maxWidth: 600, margin: "0 auto" }}>
        <h2>Complete Your Profile</h2>
        <p>Please provide your delivery address</p>

        <div style={{ marginTop: 20 }}>
          <input
            type="text"
            value={address.name}
            onChange={(e) => setAddress({...address, name: e.target.value})}
            placeholder="Your Name *"
            style={{ width: "100%", padding: 10, marginBottom: 10 }}
          />

          <input
            type="text"
            value={address.addressLine}
            onChange={(e) => setAddress({...address, addressLine: e.target.value})}
            placeholder="Address Line (House/Street) *"
            style={{ width: "100%", padding: 10, marginBottom: 10 }}
          />

          <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
            <input
              type="text"
              value={address.city}
              onChange={(e) => setAddress({...address, city: e.target.value})}
              placeholder="City *"
              style={{ flex: 1, padding: 10 }}
            />
            <input
              type="text"
              value={address.state}
              onChange={(e) => setAddress({...address, state: e.target.value})}
              placeholder="State"
              style={{ flex: 1, padding: 10 }}
            />
          </div>

          <input
            type="text"
            value={address.pincode}
            onChange={(e) => setAddress({...address, pincode: e.target.value})}
            placeholder="Pincode *"
            style={{ width: "100%", padding: 10, marginBottom: 20 }}
          />

          <button 
            onClick={handleAddressSubmit}
            style={{ 
              width: "100%", 
              padding: 12, 
              background: "#007bff", 
              color: "white", 
              border: "none", 
              borderRadius: 5,
              cursor: "pointer",
              fontSize: 16
            }}
          >
            Save & Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 30 }}>
      <h2>Login with Email</h2>
      <p>Click below to login as <b>{email}</b></p>
      <button onClick={handleVerify} style={{ marginTop: 10 }}>
        Login
      </button>
    </div>
  );
}
