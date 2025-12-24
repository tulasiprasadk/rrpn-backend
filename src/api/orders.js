// src/api/orders.js

export const fetchOrder = async (orderId) => {
  try {
    const res = await fetch(`/orders/${orderId}`);

    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    return data;
  } catch (err) {
    console.error("Error fetching order:", err);
    return null;
  }
};
