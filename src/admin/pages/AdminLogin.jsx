import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminAuth } from "../../context/AdminAuthContext";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { loginAdmin } = useAdminAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok && data.token) {
        loginAdmin(data.token);            // Save JWT token
        navigate("/admin");           // Redirect to dashboard
      } else {
        alert(data.message || "Invalid credentials");
      }
    } catch (err) {
      alert("Something went wrong");
    }

    setLoading(false);
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-200">
      <form className="bg-white p-8 shadow rounded w-96" onSubmit={submit}>
        <h2 className="text-2xl mb-5 font-bold text-center">Admin Login</h2>

        <input
          type="email"
          placeholder="Email"
          className="w-full p-2 border mb-3"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full p-2 border mb-4"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button
          disabled={loading}
          className="bg-blue-600 text-white w-full py-2 rounded"
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
};

export default AdminLogin;
