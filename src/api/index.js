// src/api/index.js

const BASE = import.meta.env.VITE_API_BASE || "/api";

// Get all products or search by keyword
export async function getProducts(query = "") {
  try {
    const url = query
      ? `${BASE}/products?q=${encodeURIComponent(query)}`
      : `${BASE}/products`;

    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to load products");
    return res.json();
  } catch (err) {
    console.error("API getProducts error:", err);
    return [];
  }
}

// Get a single product by ID
export async function getProduct(id) {
  try {
    const res = await fetch(`${BASE}/products/${id}`);
    if (!res.ok) throw new Error("Failed to load product");
    return res.json();
  } catch (err) {
    console.error("API getProduct error:", err);
    return null;
  }
}
