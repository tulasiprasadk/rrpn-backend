// frontend/src/pages/CartPage.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CartPage.css";

export default function BagPage() {
  const [bag, setBag] = useState([]);
  const navigate = useNavigate();

  const loadBag = () => {
    const savedBag = JSON.parse(localStorage.getItem("bag") || "[]");
    setBag(savedBag);
  };

  useEffect(() => {
    loadBag();
  }, []);

  const changeQty = (id, qty) => {
    if (qty < 1) return;
    const updatedBag = bag.map(item => 
      item.id === id ? { ...item, quantity: qty } : item
    );
    setBag(updatedBag);
    localStorage.setItem("bag", JSON.stringify(updatedBag));
  };

  const remove = (id) => {
    const updatedBag = bag.filter(item => item.id !== id);
    setBag(updatedBag);
    localStorage.setItem("bag", JSON.stringify(updatedBag));
  };

  const clearBag = () => {
    setBag([]);
    localStorage.setItem("bag", JSON.stringify([]));
  };

  const subtotal = bag.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const checkout = () => {
    if (bag.length === 0) {
      alert("Your bag is empty!");
      return;
    }
    navigate("/checkout");
  };

  return (
    <div className="bag-page">
      <div className="bag-container">
        <h2 className="bag-title">🛍️ Your Bag</h2>
        
        {bag.length === 0 && (
          <div className="empty-bag">
            <p>Your bag is empty</p>
            <button className="continue-btn" onClick={() => navigate("/")}>
              Continue Shopping
            </button>
          </div>
        )}

        {bag.length > 0 && (
          <>
            <div className="bag-items">
              {bag.map((item) => (
                <div key={item.id} className="bag-item">
                  {item.image && (
                    <img 
                      src={`/${item.image}`} 
                      alt={item.title} 
                      className="bag-item-image" 
                    />
                  )}
                  <div className="bag-item-details">
                    <h3 className="bag-item-title">
                      {item.title}
                      {item.titleKannada && (
                        <span style={{ color: '#c8102e', fontSize: '14px', display: 'block', marginTop: '4px' }}>
                          {item.titleKannada}
                        </span>
                      )}
                    </h3>
                    {item.variety && (
                      <p className="bag-item-variety">{item.variety} - {item.subVariety}</p>
                    )}
                    <p className="bag-item-price">₹{item.price}/{item.unit || 'piece'}</p>
                    
                    <div className="bag-item-actions">
                      <div className="quantity-control">
                        <button 
                          className="qty-btn"
                          onClick={() => changeQty(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >
                          -
                        </button>
                        <span className="qty-display">{item.quantity}</span>
                        <button 
                          className="qty-btn"
                          onClick={() => changeQty(item.id, item.quantity + 1)}
                        >
                          +
                        </button>
                      </div>
                      <button 
                        className="remove-btn"
                        onClick={() => remove(item.id)}
                      >
                        🗑 Remove
                      </button>
                    </div>
                    
                    <p className="bag-item-total">
                      Subtotal: <strong>₹{(item.price * item.quantity).toFixed(2)}</strong>
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bag-summary">
              <div className="summary-row">
                <span>Items:</span>
                <span>{bag.reduce((sum, item) => sum + item.quantity, 0)}</span>
              </div>
              <div className="summary-row total">
                <span>Total:</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              
              <div className="bag-actions">
                <button className="clear-btn" onClick={clearBag}>
                  Clear Bag
                </button>
                <button className="continue-btn" onClick={() => navigate("/")}>
                  Continue Shopping
                </button>
                <button className="checkout-btn" onClick={checkout}>
                  Proceed to Checkout →
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
