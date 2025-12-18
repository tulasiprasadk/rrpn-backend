// src/pages/Flowers.jsx

import flowers from "../data/flowers.json";
import { useCrackerCart } from "../context/CrackerCartContext";
import CartPanel from "../components/CartPanel";

// Simple emoji and Kannada mapping for common flowers
const flowerInfo = {
  Mallige: { emoji: "🌼", kn: "ಮಲ್ಲಿಗೆ" },
  "Sujee mallige": { emoji: "🌼", kn: "ಸುಜೀ ಮಲ್ಲಿಗೆ" },
  Kanakambara: { emoji: "🌺", kn: "ಕನಕಾಂಬರ" },
  Kakada: { emoji: "🌸", kn: "ಕಾಕಡ" },
  Jajee: { emoji: "🌻", kn: "ಜಾಜೀ" },
  "Ganere /ganagile": { emoji: "🌷", kn: "ಗಣೇರೆ / ಗಣಗಿಲೆ" },
  Sevanthige: { emoji: "🌻", kn: "ಸೇವಂತಿಗೆ" },
  "Rose ( red)": { emoji: "🌹", kn: "ಗುಲಾಬಿ (ಕೆಂಪು)" },
  "Sevanthige(yellow)": { emoji: "🌻", kn: "ಸೇವಂತಿಗೆ (ಹಳದಿ)" },
  "Rose (pink)": { emoji: "🌹", kn: "ಗುಲಾಬಿ (ಗುಲಾಬಿ)" },
  "Rose (Yellow)": { emoji: "🌹", kn: "ಗುಲಾಬಿ (ಹಳದಿ)" },
  "Sevanthige  ( white)": { emoji: "🌼", kn: "ಸೇವಂತಿಗೆ (ಬಿಳಿ)" },
  "Sevanthige (blue)": { emoji: "🌼", kn: "ಸೇವಂತಿಗೆ (ನೀಲಿ)" }
};

export default function Flowers() {
  const { addItem } = useCrackerCart();

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "#FFF8E1"
      }}
    >
      {/* LEFT: PRODUCTS */}
      <div style={{ flex: 1, padding: "24px 32px" }}>
        <h1 style={{ marginBottom: 8, color: "#C8102E" }}>
          🌸 RR Nagar Flowers
        </h1>

        <p style={{ color: "#555", marginBottom: 24 }}>
          Fresh flowers available. 🚚 Same-day / Next-day delivery.
        </p>

        {flowers.map((cat) => (
          <div key={cat.category} style={{ marginBottom: 32 }}>
            <h2
              style={{
                borderBottom: "2px solid #C8102E",
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
              {cat.products.map((product) => {
                const info = flowerInfo[product.name?.trim()] || {};

                return (
                  <div
                    key={product.id}
                    style={{
                      border: "1px solid #eee",
                      borderRadius: 12,
                      padding: 12,
                      background: "#fff",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      minHeight: 110,
                      cursor: "pointer",
                      transition: "box-shadow 0.2s"
                    }}
                    onClick={() =>
                      addItem({
                        id: `${cat.category}-${product.name}`,
                        name: product.name,
                        price: product.price,
                        unit: product.unit
                      })
                    }
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.boxShadow =
                        "0 2px 12px rgba(200,16,46,0.12)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.boxShadow = "none")
                    }
                  >
                    <span style={{ fontSize: 32 }}>
                      {info.emoji || "🌸"}
                    </span>

                    <span style={{ fontWeight: 700 }}>
                      {product.name}
                    </span>

                    {info.kn && (
                      <span
                        style={{
                          color: "#C8102E",
                          fontSize: 14,
                          fontWeight: 600,
                          fontFamily: 'Noto Sans Kannada, sans-serif'
                        }}
                      >
                        {info.kn}
                      </span>
                    )}

                    <span style={{ fontSize: 13, color: "#555" }}>
                      ₹{product.price} / {product.unit}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* RIGHT: CART */}
      <CartPanel />
    </div>
  );
}
