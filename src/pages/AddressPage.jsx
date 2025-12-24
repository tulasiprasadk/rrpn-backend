import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../api/client";

export default function AddressPage() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      console.log("Loading addresses...");
      const res = await axios.get(`${API_BASE}/customer/address`);
      console.log("Addresses loaded from API:", res.data);
      setList(res.data);
    } catch (err) {
      console.error("Failed to load addresses:", err);
      if (err.response?.status === 401) {
        setError("Please log in to view your addresses");
        navigate("/login");
      } else {
        setError(err.response?.data?.error || "Failed to load addresses");
      }
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [navigate]);

  const deleteAddress = async (id) => {
    if (!window.confirm("Delete this address?")) return;
    await axios.delete(`${API_BASE}/customer/address/${id}`);
    load();
  };

  const makeDefault = async (id) => {
    await axios.put(`${API_BASE}/customer/address/${id}/default`);
    load();
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>My Addresses</h2>


      {loading && <div style={{ color: "#666" }}>Loading addresses...</div>}
      
      {error && (
        <div style={{ color: "crimson", marginBottom: 12 }}>
          {error}
          <br />
          <button onClick={() => navigate("/login")} style={{ marginTop: 8 }}>
            Go to Login
          </button>
        </div>
      )}

      {!loading && !error && (
        <>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <button onClick={() => navigate("/address/manage")}>
              Add New Address
            </button>
            
            {list.length > 0 && (
              <button 
                onClick={() => navigate("/checkout")}
                style={{ 
                  background: '#28a745', 
                  color: 'white',
                  fontWeight: 'bold',
                  padding: '10px 20px'
                }}
              >
                Continue to Checkout →
              </button>
            )}
          </div>

          {list.length === 0 ? (
            <div style={{ marginTop: 12, color: "#666" }}>
              No addresses yet. <button onClick={() => navigate("/address/manage")}>Add one</button>
            </div>
          ) : (
            <ul style={{ listStyle: "none", padding: 0 }}>
              {list.map((a) => (
                <li key={a.id} style={{ marginTop: 15, padding: 10, border: "1px solid #ccc" }}>
                  <strong>{a.name}</strong> ({a.phone})<br />
                  {a.addressLine}, {a.city}, {a.state} - {a.pincode}
                  <br />

                  {a.isDefault && (
                    <span style={{ color: "green", fontWeight: "bold" }}>
                      ✔ Default Address
                    </span>
                  )}

                  <br />
                  <button onClick={() => navigate("/address/manage", { state: a })}>
                    Edit
                  </button>

                  <button onClick={() => deleteAddress(a.id)}>
                    Delete
                  </button>

                  {!a.isDefault && (
                    <button onClick={() => makeDefault(a.id)}>
                      Set as Default
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
