// Save buyer/user ID
export const setBuyerId = (id) => {
  localStorage.setItem("buyerId", id);
};

// Get buyer/user ID
export const getBuyerId = () => {
  return localStorage.getItem("buyerId");
};

// Clear buyer session
export const clearBuyerSession = () => {
  localStorage.removeItem("buyerId");
};
