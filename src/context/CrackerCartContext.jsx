import { createContext, useContext, useState } from "react";

const CartContext = createContext();

export function CrackerCartProvider({ children }) {
  const [cart, setCart] = useState([]);

  const addItem = (product) => {
    setCart((prev) => {
      const existing = prev.find((p) => p.id === product.id);
      if (existing) {
        return prev.map((p) =>
          p.id === product.id ? { ...p, qty: p.qty + 1 } : p
        );
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const updateQty = (id, qty) => {
    setCart((prev) =>
      qty <= 0 ? prev.filter((p) => p.id !== id) :
      prev.map((p) => (p.id === id ? { ...p, qty } : p))
    );
  };

  const total = cart.reduce((sum, i) => sum + i.price * i.qty, 0);

  return (
    <CartContext.Provider value={{ cart, addItem, updateQty, total }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCrackerCart = () => useContext(CartContext);
