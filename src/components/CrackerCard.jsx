import { useCrackerCart } from "../context/CrackerCartContext";

export default function CrackerCard({ product }) {
  const { addItem } = useCrackerCart();

  return (
    <div
      style={{
        border: "1px solid #e5e5e5",
        borderRadius: 10,
        padding: 14,
        background: "#fff",
        boxShadow: "0 2px 6px rgba(0,0,0,0.05)"
      }}
    >
      <h4 style={{ marginBottom: 6 }}>{product.name}</h4>
      <p style={{ color: "#444", marginBottom: 12 }}>
        ₹ {product.price} / {product.unit}
      </p>

      <button
        onClick={() => addItem(product)}
        style={{
          width: "100%",
          padding: "8px 0",
          borderRadius: 6,
          border: "none",
          background: "#d62828",
          color: "#fff",
          cursor: "pointer"
        }}
      >
        Add to Cart
      </button>
    </div>
  );
}
