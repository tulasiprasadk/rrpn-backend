import React, { createContext, useContext, useState } from "react";

const QuickCartContext = createContext();

export function QuickCartProvider({ children }) {
  const [cart, setCart] = useState([]);

  function addItem(product, qty = 1) {
    setCart((prev) => {
      const exists = prev.find((p) => p.id === product.id);
      if (exists) {
        return prev.map((p) =>
          p.id === product.id ? { ...p, qty: p.qty + qty } : p
        );
      } else {
        return [...prev, { ...product, qty }];
      }
    });
  }

  return (
    <QuickCartContext.Provider value={{ cart, addItem }}>
      {children}
    </QuickCartContext.Provider>
  );
}

export function useQuickCart() {
  return useContext(QuickCartContext);
}
