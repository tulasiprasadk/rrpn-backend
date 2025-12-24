import React from "react";
import { useQuickCart } from "../context/QuickCartContext";

export default function ProductCard({ product = {} }) {
  const { addItem } = useQuickCart();

  const {
    name = "Unnamed Product",
    price = 0,
    image = "",
    description = "",
  } = product;

  return (
    <div
      className="product-card"
      style={{
        border: "1px solid #ddd",
        padding: 12,
        borderRadius: 8,
        background: "#fff",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
      }}
    >
      <div
        style={{
          width: "100%",
          height: 150,
          borderRadius: 6,
          overflow: "hidden",
          background: "#f5f5f5",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {image ? (
          <img
            src={image}
            alt={name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
        ) : (
          <div style={{ fontSize: 32, color: "#999" }}>??</div>
        )}
      </div>

      <h3 style={{ margin: 0, fontSize: 16 }}>{name}</h3>

      {description ? (
        <p style={{ margin: 0, color: "#666", fontSize: 13 }}>{description}</p>
      ) : null}

      <div
        style={{
          marginTop: "auto",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <strong style={{ fontSize: 16 }}>?{price}</strong>

        <button
          onClick={() => addItem(product, 1)}
          style={{
            background: "#0d6efd",
            color: "#fff",
            border: "none",
            padding: "6px 10px",
            borderRadius: 6,
            cursor: "pointer",
          }}
          type="button"
        >
          Add
        </button>
      </div>
    </div>
  );
}
