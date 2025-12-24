// frontend/src/pages/CustomerLogin.jsx
import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function CustomerLogin() {
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const requestOtp = async () => {
    try {
      setError("");

      const res = await axios.post(
        "http://localhost:4000/api/auth/request-otp",
        { mobile: phone }   // backend requires "mobile", not "phone"
      );

      console.log("OTP RESPONSE:", res.data);

      // navigate to OTP verify screen
      navigate("/verify", { state: { phone } });

    } catch (err) {
      console.error(err);
      setError("Failed to send OTP. Please try again.");
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Login</h2>

      <input
        placeholder="Phone number"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />

      <button onClick={requestOtp} style={{ display: "block", marginTop: 10 }}>
        Send OTP
      </button>

      {error && (
        <p style={{ color: "red", marginTop: 10 }}>
          {error}
        </p>
      )}
    </div>
  );
}
