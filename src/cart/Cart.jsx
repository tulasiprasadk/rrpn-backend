import React, { useEffect, useState } from "react";
import axios from "axios";

const API = "/api";

function Cart() {
  const [items, setItems] = useState([]);

  const loadCart = async () => {
    try {
      const res = await axios.get(`${API}/cart`, {
        headers: { Authorization: "Bearer " + localStorage.getItem("token") }
      });
      setItems(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const updateQty = async (itemId, qty) => {
    try {
      await axios.post(
        `${API}/cart/update`,
        { itemId, quantity: qty },
        { headers: { Authorization: "Bearer " + localStorage.getItem("token") } }
      );
      loadCart();
    } catch (err) {
      console.error(err);
    }
  };

  const clearCart = async () => {
    await axios.post(
      `${API}/cart/clear`,
      {},
      { headers: { Authorization: "Bearer " + localStorage.getItem("token") } }
    );
    loadCart();
  };

  useEffect(() => {
    loadCart();
  }, []);

  const total = items.reduce((sum, it) => sum + Number(it.total_price), 0);

  return (
    <div className="cart-page">
      <h2>Your Cart</h2>

      {items.length === 0 && <p>No items in cart.</p>}

      {items.map((item) => (
        <div className="cart-item" key={item.id}>
          <img src={item.product_images?.[0]} alt="" />

          <div className="info">
            <h3>{item.product_name}</h3>
            <p>{item.variety_name}</p>
            {item.sub_variety_name && <p>{item.sub_variety_name}</p>}
            <p>₹{item.unit_price}</p>
          </div>

          <div className="qty-controls">
            <button onClick={() => updateQty(item.id, item.quantity - 1)}>-</button>
            <span>{item.quantity}</span>
            <button onClick={() => updateQty(item.id, item.quantity + 1)}>+</button>
          </div>

          <p className="item-total">₹{item.total_price}</p>
        </div>
      ))}

      {items.length > 0 && (
        <>
          <h3>Total: ₹{total}</h3>
          <button
            className="checkout-btn"
            onClick={() => (window.location.href = "/checkout")}
          >
            Checkout
          </button>

          <button className="clear-btn" onClick={clearCart}>
            Clear Cart
          </button>
        </>
      )}
    </div>
  );
}

export default Cart;
