// src/utils/session.js

// Store buyer ID
export const setBuyerId = (id) => {
  localStorage.setItem("buyerId", id);
};

// Retrieve buyer ID
export const getBuyerId = () => {
  return localStorage.getItem("buyerId");
};

// Clear buyer ID
export const clearBuyerSession = () => {
  localStorage.removeItem("buyerId");
};
