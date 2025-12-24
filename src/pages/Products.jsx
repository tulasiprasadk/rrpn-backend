// src/pages/Products.jsx

import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { getProducts } from "../api";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [params] = useSearchParams();
  const searchQuery = params.get("search") || "";

  useEffect(() => {
    setLoading(true);

    getProducts(searchQuery)
      .then((data) => {
        setProducts(data || []);
        setLoading(false);
      })
      .catch(() => {
        setProducts([]);
        setLoading(false);
      });
  }, [searchQuery]);

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Products {searchQuery ? `— "${searchQuery}"` : ""}</h2>

      {loading && <p>Loading...</p>}

      {!loading && products.length === 0 && (
        <p>No products found.</p>
      )}

      <div
        style={{
          marginTop: "1.5rem",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: "1.5rem",
        }}
      >
        {products.map((p) => (
          <Link
            to={`/product/${p.id}`}
            key={p.id}
            style={{
              textDecoration: "none",
              color: "inherit",
              background: "#fff",
              padding: "1rem",
              borderRadius: "10px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            <h3>{p.title}</h3>
            <p>{p.description}</p>
            <strong>?{p.price}</strong>
            <p style={{ marginTop: "8px", fontSize: "0.9rem" }}>
              <b>Category:</b> {p.Category?.name}
              <br />
              <b>Supplier:</b> {p.Supplier?.name}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
