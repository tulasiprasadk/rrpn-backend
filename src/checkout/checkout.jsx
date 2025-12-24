import React, { useState } from "react";
import axios from "axios";

const API = "/api";

function Checkout() {
  const [address, setAddress] = useState({
    line1: "",
    landmark: "",
    pincode: ""
  });

  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [loading, setLoading] = useState(false);

  const placeOrder = async () => {
    setLoading(true);
    try {
      const res = await axios.post(
        `${API}/orders/checkout`,
        {
          paymentMethod,
          deliveryAddress: address
        },
        {
          headers: { Authorization: "Bearer " + localStorage.getItem("token") }
        }
      );

      const orderIds = res.data.orders.map((o) => o.id);
      window.location.href = `/order-success?ids=${orderIds.join(",")}`;
    } catch (err) {
      console.error(err);
      alert("Checkout failed");
    }
    setLoading(false);
  };

  return (
    <div className="checkout-page">
      <h2>Checkout</h2>

      <h3>Delivery Address</h3>
      <input
        type="text"
        placeholder="Address line"
        value={address.line1}
        onChange={(e) => setAddress({ ...address, line1: e.target.value })}
      />

      <input
        type="text"
        placeholder="Landmark"
        value={address.landmark}
        onChange={(e) => setAddress({ ...address, landmark: e.target.value })}
      />

      <input
        type="text"
        placeholder="Pincode"
        value={address.pincode}
        onChange={(e) => setAddress({ ...address, pincode: e.target.value })}
      />

      <h3>Payment</h3>
      <select
        value={paymentMethod}
        onChange={(e) => setPaymentMethod(e.target.value)}
      >
        <option value="cod">Cash on Delivery</option>
        <option value="online">Online Payment (coming soon)</option>
      </select>

      <button disabled={loading} onClick={placeOrder}>
        {loading ? "Placing order..." : "Place Order"}
      </button>
    </div>
  );
}

export default Checkout;
