// This file has been cleaned of merge conflict markers.
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Cart.css";

export default function Cart() {
  const navigate = useNavigate();

  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);

  // ================================
  // Fetch cart from backend
  // ================================
  const loadCart = async () => {
    setLoading(true);
    try {
      const res = await fetch("/cart");
      const data = await res.json();

      if (!res.ok) {
        console.error(data);
        return;
      }

      setCart(data.items || []);
    } catch (err) {
      console.error("Cart load error:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadCart();
  }, []);

  // ================================
  // Add / Remove Quantity
  // ================================
  const updateQty = async (itemId, qty) => {
    if (qty < 1) return;

    try {
      const res = await fetch("/cart/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, quantity: qty }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Failed to update cart");
        return;
      }

      loadCart();
    } catch (err) {
      console.error(err);
    }
  };

  // ================================
  // Remove item
  // ================================
  const removeItem = async (itemId) => {
    try {
      const res = await fetch("/cart/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Failed to remove item");
        return;
      }

      loadCart();
    } catch (err) {
      console.error(err);
    }
  };

  // ================================
  // Clear entire cart
  // ================================
  const clearCart = async () => {
    try {
      await fetch("/cart/clear", { method: "POST" });
      loadCart();
    } catch (err) {
      console.error(err);
    }
  };

  // ================================
  // Total Price
  // ================================
  const total = cart.reduce((sum, item) => {
    const price = item.variety_price || item.price;
    return sum + price * item.quantity;
  }, 0);

  if (loading) {
    return <div className="cart-loading">Loading cart...</div>;
  }

  if (cart.length === 0) {
    return (
      <div className="cart-empty">
        <h2>Your Cart is Empty</h2>
        <button onClick={() => navigate("/")}>Continue Shopping</button>
      </div>
    );
  }

  return (
    <div className="cart-container">
      <h1>Your Cart</h1>

      <div className="cart-items">
        {cart.map((item) => (
          <div className="cart-item" key={item.id}>
            <img src={item.image_url} alt={item.name} />

            <div className="cart-info">
              <h3>{item.name}</h3>

              {item.variety_name && (
                <p className="variety">Variety: {item.variety_name}</p>
              )}

              {item.subvariety_name && (
                <p className="sub-variety">Option: {item.subvariety_name}</p>
              )}

              <div className="price">₹ {item.variety_price || item.price}</div>

              <div className="qty-controls">
                <button onClick={() => updateQty(item.id, item.quantity - 1)}>−</button>
                <span>{item.quantity}</span>
                <button onClick={() => updateQty(item.id, item.quantity + 1)}>+</button>
              </div>

              <button className="remove-btn" onClick={() => removeItem(item.id)}>
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* CART FOOTER */}
      <div className="cart-summary">
        <h2>Total: ₹ {total}</h2>

        <div className="cart-actions">
          <button onClick={clearCart} className="clear-cart">
            Clear Cart
          </button>

          <button onClick={() => navigate("/checkout")} className="checkout-btn">
            Proceed to Checkout
          </button>
        </div>
      </div>
    </div>
  );
}
