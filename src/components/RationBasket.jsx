import { useEffect, useMemo, useState } from "react";

function readStoredCart() {
  if (typeof window === "undefined") {
    return [];
  }

  const bag = JSON.parse(localStorage.getItem("bag") || "null");
  const cart = JSON.parse(localStorage.getItem("cart") || "[]");
  const rows = Array.isArray(bag) && bag.length ? bag : Array.isArray(cart) ? cart : [];

  return rows.map((item, index) => {
    const quantity = Number(item.quantity || item.qty || 1);
    const unitPrice = Number(item.price || item.basePrice || item.unitPrice || 0);
    return {
      id: item.id || item.productId || `ration-item-${index}`,
      title: item.title || item.product_name || item.productName || "Item",
      quantity,
      unitPrice,
      lineTotal: Number((quantity * unitPrice).toFixed(2)),
      unit: item.unit || ""
    };
  });
}

export default function RationBasket({ title = "Ration Basket" }) {
  const [expanded, setExpanded] = useState(false);
  const [items, setItems] = useState(() => readStoredCart());

  useEffect(() => {
    const syncCart = () => setItems(readStoredCart());
    syncCart();
    window.addEventListener("storage", syncCart);
    return () => window.removeEventListener("storage", syncCart);
  }, []);

  const previewItems = useMemo(() => items.slice(0, 3), [items]);
  const hiddenCount = Math.max(items.length - previewItems.length, 0);
  const total = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.lineTotal || 0), 0),
    [items]
  );

  if (!items.length) {
    return null;
  }

  return (
    <div
      className="payment-card"
      style={{
        background: "#fffaf0",
        padding: "18px 20px",
        borderRadius: 14,
        marginBottom: 20,
        border: "1px solid rgba(210, 140, 0, 0.18)",
        boxShadow: "0 8px 22px rgba(194, 120, 0, 0.08)"
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", color: "#9a3412" }}>
            Transparent Basket View
          </div>
          <div style={{ marginTop: 4, fontSize: 24, fontWeight: 900, color: "#5A3A00" }}>{title}</div>
          <div style={{ marginTop: 6, color: "#7c5200", fontSize: 14 }}>
            {items.length} item{items.length === 1 ? "" : "s"} in this basket
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", color: "#9a3412" }}>Total</div>
          <div style={{ marginTop: 4, fontSize: 28, fontWeight: 900, color: "#C8102E" }}>
            Rs {Number(total || 0).toFixed(2)}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gap: 8, marginTop: 14 }}>
        {previewItems.map((item) => (
          <div
            key={item.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              padding: "10px 12px",
              borderRadius: 12,
              background: "#fff",
              color: "#5A3A00"
            }}
          >
            <span>{item.title}</span>
            <span>x {item.quantity}</span>
          </div>
        ))}
        {hiddenCount > 0 && !expanded ? (
          <div style={{ color: "#8b5e00", fontWeight: 700, fontSize: 14 }}>
            + {hiddenCount} more item{hiddenCount === 1 ? "" : "s"}
          </div>
        ) : null}
      </div>

      {expanded ? (
        <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
          {items.map((item) => (
            <div
              key={`expanded-${item.id}`}
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                padding: "10px 12px",
                borderRadius: 12,
                background: "#fff7d6",
                color: "#6b3f00"
              }}
            >
              <span>
                {item.title} x {item.quantity}
              </span>
              <span>Rs {Number(item.lineTotal || item.unitPrice || 0).toFixed(2)}</span>
            </div>
          ))}
        </div>
      ) : null}

      {items.length > 3 ? (
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          style={{
            marginTop: 14,
            background: "transparent",
            border: "none",
            color: "#C8102E",
            fontWeight: 800,
            cursor: "pointer",
            padding: 0
          }}
        >
          {expanded ? "Hide list ↑" : "View full list ↓"}
        </button>
      ) : null}
    </div>
  );
}
