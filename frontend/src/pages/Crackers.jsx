// Emoji and Kannada mapping for common crackers
const crackerInfo = {
  "Sparklers": { emoji: "✨", kn: "ಸ್ಪಾರ್ಕ್ಲರ್ಸ್" },
  "Flowerpot": { emoji: "🏵️", kn: "ಫ್ಲವರ್ ಪಾಟ್" },
  "Chakra": { emoji: "🌀", kn: "ಚಕ್ರ" },
  "Rocket": { emoji: "🚀", kn: "ರಾಕೆಟ್" },
  "Bomb": { emoji: "💣", kn: "ಬಾಂಬ್" },
  "Pencil": { emoji: "✏️", kn: "ಪೆನ್ಸಿಲ್" },
  "Twinkling Star": { emoji: "🌟", kn: "ಟ್ವಿಂಕ್ಲಿಂಗ್ ಸ್ಟಾರ್" },
  "Ground Chakkar": { emoji: "🌀", kn: "ಗ್ರೌಂಡ್ ಚಕ್ರ" },
  "Anar": { emoji: "🎇", kn: "ಅನಾರ್" },
  "Bijili": { emoji: "⚡", kn: "ಬಿಜಿಲಿ" },
  "Zamin Chakkar": { emoji: "🌀", kn: "ಜಮೀನ್ ಚಕ್ರ" },
  "Rocket Bomb": { emoji: "🚀", kn: "ರಾಕೆಟ್ ಬಾಂಬ್" },
  "Deluxe": { emoji: "🎆", kn: "ಡಿಲಕ್ಸ್" },
  // Add more as needed
};
import crackers from "../data/crackers.json";
import CrackerCard from "../components/CrackerCard";
import { useCrackerCart } from "../context/CrackerCartContext";
import CartPanel from "../components/CartPanel";

export default function Crackers() {
  const { addItem } = useCrackerCart();
  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "#FFF8E1"
      }}
    >
      {/* Products */}
      <div style={{ flex: 1, padding: "24px 32px" }}>
        <h1
          style={{
            marginBottom: 8,
            color: "#C8102E"
          }}
        >
          🎆 RRNAGAR Crackers
        </h1>

        <p style={{ color: "#555", marginBottom: 24 }}>
          Select your preferred crackers. 🚚 Delivery in 7–15 days.
        </p>

        {crackers.map((cat) => (
          <div key={cat.category} style={{ marginBottom: 32 }}>
            <h2
              style={{
                borderBottom: "2px solid #C8102E",
                paddingBottom: 6,
                color: "#333"
              }}
            >
              {cat.category}
            </h2>
            <div
              className="product-grid"
              style={{
                display: "grid",
                gridTemplateColumns: 'repeat(5, 1fr)',
                gap: 16,
                marginTop: 16
              }}
            >
              {cat.products.map((product) => {
                const key = Object.keys(crackerInfo).find(k => product.name && product.name.toLowerCase().includes(k.toLowerCase()));
                const info = crackerInfo[key] || {};
                return (
                  <div key={product.id} style={{
                    border: '1px solid #eee',
                    borderRadius: 12,
                    padding: 12,
                    background: '#fff',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: 110
                  }}>
                    <span style={{ fontSize: 32, marginBottom: 4 }}>{info.emoji || "🎆"}</span>
                    <span style={{ fontWeight: 700 }}>{product.name}</span>
                    <span style={{ color: '#c8102e', fontSize: 15, fontWeight: 600, marginTop: 2 }}>{info.kn || ''}</span>
                    <span style={{ fontSize: 13, color: '#555', marginTop: 2 }}>₹{product.price} / {product.unit}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      {/* Cart */}
      <CartPanel />
    </div>
  );
}
