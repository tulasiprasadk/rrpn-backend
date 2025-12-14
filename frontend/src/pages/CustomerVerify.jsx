import { useState } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";

export default function CustomerVerify() {
  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email || "";
  const [otp, setOtp] = useState("");
  const [isNewUser, setIsNewUser] = useState(false);
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
      const res = await axios.post("/api/auth/verify-email-otp", { email, otp }, { withCredentials: true });

      // Check if this is a new user (first time login)
      if (res.data.isNewUser) {
        setIsNewUser(true);
      } else {
        // Existing user, redirect to dashboard
        navigate("/dashboard");
      }

    } catch (err) {
      console.error(err);
      alert("Invalid OTP");
    }
  };

  const handleAddressSubmit = async () => {
    try {
      if (!address.name || !address.addressLine || !address.city || !address.pincode) {
        alert("Please fill all address fields");
        return;
      }

      console.log("Submitting address:", address);
      
      const response = await axios.post("/api/customer/address", {
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

  if (isNewUser) {
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
      <h2>Verify OTP</h2>

      <p>OTP sent to: <b>{email}</b></p>

      <input
        value={otp}
        onChange={(e) => setOtp(e.target.value)}
        placeholder="Enter OTP"
      />

      <button onClick={handleVerify} style={{ marginTop: 10 }}>
        Verify OTP
      </button>
    </div>
  );
}
