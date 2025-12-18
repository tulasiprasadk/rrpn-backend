// src/pages/ProductDetail.jsx

import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getProduct } from "../api";
// frontend/src/pages/ProductDetail.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState({ product: null, related: [], supplier: null });
  const [qty, setQty] = useState(1);
  const token = localStorage.getItem("customerToken");

  useEffect(() => {
    axios.get(`/api/products/${id}`).then((res) => setData(res.data)).catch(() => {});
  }, [id]);

  const addToCart = async () => {
    if (!token) return navigate("/login");
    await axios.post(
      "/api/cart/add",
      { productId: id, quantity: qty },
      { headers: { Authorization: "Bearer " + token } }
    );
    // simple feedback + navigate to cart
    navigate("/cart");
  };

  if (!data.product) return <div>Loading...</div>;

  const { product, related, supplier } = data;

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: "flex", gap: 20 }}>
        <div style={{ flex: "0 0 320px" }}>
          <img src={product.imageUrl} alt={product.name} style={{ width: "100%", borderRadius: 8 }} loading="lazy" />
        </div>

        <div style={{ flex: 1 }}>
          <h2>{product.name}</h2>
          <div>₹{product.price}</div>
          <p>{product.description}</p>

          <div style={{ marginTop: 10 }}>
            <label>Quantity </label>
            <button onClick={() => setQty(Math.max(1, qty - 1))}>-</button>
            <span style={{ margin: "0 8px" }}>{qty}</span>
            <button onClick={() => setQty(qty + 1)}>+</button>
          </div>

          <div style={{ marginTop: 16 }}>
            <button onClick={addToCart}>Add to cart</button>
            <button style={{ marginLeft: 8 }} onClick={() => navigate("/checkout")}>Buy now</button>
          </div>

          {supplier && (
            <div style={{ marginTop: 20, padding: 10, border: "1px solid #eee", borderRadius: 8 }}>
              <h4>Seller: {supplier.name}</h4>
              <div>Phone: {supplier.phone || "-"}</div>
              <div>Status: {supplier.status || "active"}</div>
              <a href={`/supplier/${supplier.id}`}>View Store</a>
            </div>
          )}
        </div>
      </div>

      <hr style={{ margin: "20px 0" }} />

      <h3>Related products</h3>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {related.map((r) => (
          <div
            key={r.id}
            style={{ width: 180, cursor: "pointer" }}
            onClick={() => navigate(`/product/${r.id}`)}
          >
            <img src={r.imageUrl} alt={r.name ? `Product image of ${r.name}` : 'Product image'} style={{ width: "100%", height: 120, objectFit: "cover" }} loading="lazy" />
            <div>{r.name}</div>
            <div>₹{r.price}</div>
          </div>
        ))}
      </div>
    </div>
  );
}


<Route path="/product/:id" element={<ProductDetail />} />

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProduct(id).then((data) => {
      setProduct(data);
      setLoading(false);
    });
  }, [id]);

  if (loading) return <p style={{ padding: "2rem" }}>Loading product...</p>;

  if (!product)
    return <p style={{ padding: "2rem" }}>Product not found.</p>;

  return (
    <div style={{ padding: "2rem", maxWidth: "800px", margin: "auto" }}>
      <h1>
        {product.title}
        {product.titleKannada && (
          <div style={{ fontSize: '24px', color: '#c8102e', marginTop: '8px', fontWeight: 'normal' }}>
            {product.titleKannada}
          </div>
        )}
      </h1>
      <p style={{ fontSize: "1.1rem" }}>
        {product.description}
        {product.descriptionKannada && (
          <div style={{ fontSize: '1rem', color: '#666', marginTop: '8px', fontStyle: 'italic' }}>
            {product.descriptionKannada}
          </div>
        )}
      </p>

      <h2 style={{ marginTop: "1rem" }}>₹{product.price}</h2>

      <div style={{ marginTop: "1.5rem", fontSize: "1rem" }}>
        <p><b>Category:</b> {product.Category?.name}</p>
        <p><b>Supplier:</b> {product.Supplier?.name}</p>
        <p><b>Delivery Available:</b> {product.deliveryAvailable ? "Yes" : "No"}</p>
      </div>
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

export default function ProductDetail() {
  const { id } = useParams();
  const [p, setP] = useState(null);

  useEffect(() => {
    axios.get(`/api/products/${id}`).then((res) => setP(res.data));
  }, []);

  if (!p) return "Loading...";

  return (
    <div>
      <h2>{p.name}</h2>
      <img src={p.imageUrl} style={{ width: 200 }} loading="lazy" />
      <p>{p.description}</p>
      <b>₹{p.price}</b>
    </div>
  );
}

      <button
        style={{
          marginTop: "2rem",
          padding: "12px 20px",
          background: "#ffcc00",
          border: "none",
          borderRadius: "10px",
          fontSize: "1rem",
          cursor: "pointer",
        }}
      >
        Contact Supplier
      </button>
    </div>
  );
}
