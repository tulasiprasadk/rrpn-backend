import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE } from "../api/client";

export default function CheckoutReview() {
  const location = useLocation();
  const navigate = useNavigate();

  const [defaultAddress, setDefaultAddress] = useState(null);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const selectedAddress = location.state?.selectedAddress || defaultAddress;

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError("");
        
        // Load address
        try {
          const res = await axios.get(`${API_BASE}/customer/address`);
          const list = res.data;
          const def = list.find((a) => a.isDefault) || null;
          setDefaultAddress(def);
        } catch (addrErr) {
          console.error("Address loading error:", addrErr);
          console.error("Response status:", addrErr.response?.status);
          console.error("Response data:", addrErr.response?.data);
          
          if (addrErr.response?.status === 401) {
            setError("Please log in to proceed with checkout");
            setTimeout(() => navigate("/login"), 2000);
          } else if (addrErr.code === 'ERR_NETWORK') {
            setError("Cannot connect to server. Please check if the backend is running.");
          } else {
            setError(`Failed to load address: ${addrErr.response?.data?.error || addrErr.message}`);
          }
        }

        // Load cart from localStorage
        const cartData = JSON.parse(localStorage.getItem("cart") || "[]");
        setCart(cartData);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [navigate]);

  const placeOrder = async () => {
    if (!selectedAddress) {
      alert("Please select a delivery address");
      return;
    }

    try {
      // Get cart items from localStorage
      const cart = JSON.parse(localStorage.getItem("cart") || "[]");
      
      if (cart.length === 0) {
        alert("Your cart is empty");
        return;
      }

      // Create order with first item (cart stores 'id' as productId)
      const firstItem = cart[0];
      const order = {
        productId: firstItem.id,  // Cart stores product ID as 'id'
        qty: firstItem.quantity,
        addressId: selectedAddress.id,
      };

      console.log("Creating order:", order);
      const res = await axios.post(`${API_BASE}/orders/create`, order);
      
      console.log("Order created:", res.data);
      
      // Clear cart after successful order
      localStorage.setItem("cart", JSON.stringify([]));
      
      // Navigate to payment page with orderId
      navigate("/payment", { 
        state: { 
          orderId: res.data.orderId,
          orderDetails: res.data
        } 
      });
      
    } catch (err) {
      console.error("Order creation error:", err);
      alert("Failed to create order: " + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Checkout</h2>

      {loading && <div style={{ color: "#666" }}>Loading...</div>}

      {error && (
        <div style={{ color: "crimson", marginBottom: 12, padding: 8, border: "1px solid crimson", borderRadius: 4 }}>
          {error}
          {error.includes("log in") && (
            <div style={{ marginTop: 8 }}>
              <button onClick={() => navigate("/login")}>Go to Login</button>
            </div>
          )}
        </div>
      )}

      {!loading && !error && (
        <>
          <h3>Delivery Address</h3>

          {selectedAddress ? (
            <div
              style={{
                border: "1px solid #ddd",
                padding: 15,
                borderRadius: 8,
                marginBottom: 10,
              }}
            >
              <strong>{selectedAddress.name}</strong> ({selectedAddress.phone})
              <br />
              {selectedAddress.addressLine}, {selectedAddress.city},{" "}
              {selectedAddress.state} - {selectedAddress.pincode}
            </div>
          ) : (
            <p style={{ color: "crimson" }}>
              No delivery address selected. <button onClick={() => navigate("/address")}>Add address</button>
            </p>
          )}

          <button
            style={{ marginBottom: 20 }}
            onClick={() => navigate("/address")}
          >
            Change Address
          </button>

          <h3>Order Summary</h3>
          {cart.length === 0 ? (
            <p style={{ color: "#999" }}>Your cart is empty</p>
          ) : (
            <div style={{ marginBottom: 20 }}>
              {cart.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    border: "1px solid #ddd",
                    padding: 10,
                    marginBottom: 10,
                    borderRadius: 5,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}
                >
                  <div>
                    <strong>
                      {item.title || item.productName || `Product #${item.id}`}
                      {item.titleKannada && (
                        <span style={{ color: '#c8102e', fontSize: '14px', display: 'block', marginTop: '2px' }}>
                          {item.titleKannada}
                        </span>
                      )}
                    </strong>
                    <br />
                    <span style={{ color: "#666" }}>Quantity: {item.quantity}</span>
                    {item.unit && <span style={{ color: "#999", marginLeft: 5 }}>({item.unit})</span>}
                  </div>
                  <div style={{ fontWeight: "bold", color: "#28a745" }}>
                    ₹{item.price ? (item.price * item.quantity).toFixed(2) : "N/A"}
                  </div>
                </div>
              ))}
              <div
                style={{
                  textAlign: "right",
                  fontSize: "18px",
                  fontWeight: "bold",
                  marginTop: 10,
                  paddingTop: 10,
                  borderTop: "2px solid #ddd"
                }}
              >
                Total: ₹
                {cart
                  .reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0)
                  .toFixed(2)}
              </div>
            </div>
          )}

          <br />

          <button
            onClick={placeOrder}
            disabled={!selectedAddress || cart.length === 0}
            style={{
              padding: "12px 30px",
              background: selectedAddress && cart.length > 0 ? "#28a745" : "#ccc",
              color: "white",
              border: "none",
              borderRadius: 5,
              fontSize: "16px",
              fontWeight: "bold",
              cursor: selectedAddress && cart.length > 0 ? "pointer" : "not-allowed"
            }}
          >
            Proceed to Payment →
          </button>
        </>
      )}
    </div>
  );
}
