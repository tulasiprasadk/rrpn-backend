// frontend/src/pages/Browse.jsx

import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE } from "../api/client";
import "./Browse.css";

export default function Browse() {
  const location = useLocation();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Read query params
  const params = new URLSearchParams(location.search);
  const categoryId = params.get("category");
  const searchQuery = params.get("q");

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line
  }, [categoryId, searchQuery]);

  async function loadProducts() {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/products`, {
        params: {
          categoryId,
          q: searchQuery,
        },
      });
      setProducts(res.data || []);
    } catch (err) {
      console.error("❌ Failed to load products:", err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="browse-page">
      <h1 className="browse-title">
        {searchQuery
          ? `Search results for "${searchQuery}"`
          : "Products"}
      </h1>

      {loading && <p>Loading products…</p>}

      {!loading && products.length === 0 && (
        <p>No products found.</p>
      )}

      <div className="browse-grid">
        {products.map((product) => (
          <div
            key={product.id}
            className="browse-card"
            onClick={() => navigate(`/product/${product.id}`)}
          >
            <img
              src={product.image || "/images/product-placeholder.png"}
              alt={product.title}
            />
            <h3>{product.title}</h3>
            <p className="price">₹{product.price}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
