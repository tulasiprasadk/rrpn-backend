import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function ProfilePage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
  });

  const fetchProfile = async () => {
    try {
      const res = await axios.get("/api/customer/profile");
      setForm({
        name: res.data.name || "",
        email: res.data.email || "",
      });
    } catch (err) {
      console.error("PROFILE LOAD ERROR:", err);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const saveProfile = async () => {
    try {
      await axios.put("/api/customer/profile", form);

      // Show quick toast
      alert("Profile updated successfully!");

      // Redirect to main shopping page
      navigate("/");

    } catch (err) {
      console.error("PROFILE SAVE ERROR:", err);
      alert("Failed to update profile");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>My Profile</h2>

      <div style={{ marginTop: "20px" }}>
        <label>Name</label>
        <br />
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          style={{ padding: "6px", width: "250px" }}
        />
      </div>

      <div style={{ marginTop: "10px" }}>
        <label>Email</label>
        <br />
        <input
          type="text"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          style={{ padding: "6px", width: "250px" }}
        />
      </div>

      <button
        onClick={saveProfile}
        style={{
          marginTop: "15px",
          padding: "8px 20px",
          background: "#0088ff",
          color: "white",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
        }}
      >
        Save
      </button>

      <button
        onClick={() => navigate("/login")}
        style={{
          marginLeft: "10px",
          marginTop: "15px",
          padding: "8px 20px",
          background: "#bbb",
          color: "black",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
        }}
      >
        Logout
      </button>
    </div>
  );
}
