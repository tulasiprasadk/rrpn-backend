// src/pages/Groceries.jsx

import groceries from "../data/groceries.json";
import CartPanel from "../components/CartPanel";
import { useCrackerCart } from "../context/CrackerCartContext";

function GroceriesList() {
  const { addItem } = useCrackerCart();

  return (
    <div style={{ flex: 1, padding: "24px 32px" }}>
      <h1 style={{ marginBottom: 8, color: "#2E7D32" }}>
        🛒 RR Nagar Groceries
      </h1>

      <p style={{ color: "#555", marginBottom: 24 }}>
        Fresh groceries sourced locally. Fresh First. Fast Follows.
      </p>

      {groceries.map((cat) => (
        <div key={cat.category} style={{ marginBottom: 32 }}>
          <h2
            style={{
              borderBottom: "2px solid #2E7D32",
              paddingBottom: 6
            }}
          >
            {cat.category}
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, 1fr)",
              gap: 16,
              marginTop: 16
            }}
          >
            {cat.items.map((item, idx) => (
              <div
                key={`${item.title}-${idx}`}
                style={{
                  border: "1px solid #eee",
                  borderRadius: 12,
                  padding: 12,
                  background: "#fff",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: 120,
                  cursor: "pointer",
                  textAlign: "center",
                  transition: "box-shadow 0.2s"
                }}
                onClick={() =>
                  addItem({
                    id: `${cat.category}-${item.title}`,
                    name: item.title,
                    price: item.price,
                    unit: item.unit
                  })
                }
                onMouseEnter={(e) =>
                  (e.currentTarget.style.boxShadow =
                    "0 2px 12px rgba(46,125,50,0.18)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.boxShadow = "none")
                }
              >
                <span style={{ fontSize: 32 }}>
                  {item.emoji || "🛒"}
                </span>

                <span style={{ fontWeight: 700 }}>
                  {item.title}
                </span>

                {item.kn && (
                  <span
                    style={{
                      color: "#2E7D32",
                      fontSize: 14,
                      fontWeight: 600,
                      fontFamily: "Noto Sans Kannada, sans-serif"
                    }}
                  >
                    {item.kn}
                  </span>
                )}

                <span style={{ fontSize: 13, color: "#555" }}>
                  ₹{item.price} / {item.unit}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Groceries() {
  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "#FFF8E1"
      }}
    >
      <GroceriesList />
      <CartPanel orderType="GROCERIES" />
    </div>
  );
}
