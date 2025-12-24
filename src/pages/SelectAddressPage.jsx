import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function SelectAddressPage() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await axios.get("/api/customer/address");
      console.log("Addresses loaded:", res.data);
      setList(res.data);
    } catch (err) {
      console.error("Address load error:", err);
      if (err.response?.status === 401) {
        setError("Please login first");
        // Redirect to login after 2 seconds
        setTimeout(() => navigate("/login"), 2000);
      } else {
        setError("Failed to load addresses: " + (err.response?.data?.error || err.message));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const choose = (address) => {
    navigate("/checkout", { state: { selectedAddress: address } });
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Select Delivery Address</h2>

      {error && (
        <div style={{ 
          padding: 15, 
          marginBottom: 20, 
          background: "#fee", 
          border: "1px solid #fcc",
          borderRadius: 5,
          color: "#c00"
        }}>
          {error}
        </div>
      )}

      <button onClick={() => navigate("/address/manage")}>
        + Add New Address
      </button>

      {loading ? (
        <p style={{ marginTop: 20 }}>Loading addresses...</p>
      ) : (
        <>
          {list.length === 0 && !error && (
            <p style={{ marginTop: 20, color: "#666" }}>
              No addresses found. Please add a new address.
            </p>
          )}
          <ul style={{ marginTop: 20, padding: 0, listStyle: "none" }}>
            {list.map((a) => (
              <li
                key={a.id}
                style={{
                  padding: 15,
                  marginBottom: 15,
                  border: "1px solid #ddd",
                  borderRadius: 8,
                  cursor: "pointer",
                }}
                onClick={() => choose(a)}
              >
                <strong>{a.name}</strong> ({a.phone}) <br />
                {a.addressLine}, {a.city}, {a.state} - {a.pincode}
                <br />
                {a.isDefault && (
                  <span style={{ color: "green", fontWeight: "bold" }}>
                    ✔ Default Address
                  </span>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
