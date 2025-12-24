import { useCrackerCart } from "../context/CrackerCartContext";
import { useNavigate } from "react-router-dom";

/**
 * CartPanel
 * @param {string} deliveryNote - e.g. "Delivery in 7–15 days" or "Same-day / Next-day delivery"
 * @param {string} orderType - e.g. "CRACKERS", "FLOWERS"
 */
export default function CartPanel({
  deliveryNote = "",
  orderType = "GENERAL"
}) {
  const { cart, updateQty, total } = useCrackerCart();
  const navigate = useNavigate();

  const proceed = () => {
    sessionStorage.setItem(
      "ORDER_SUMMARY",
      JSON.stringify({
        type: orderType,
        items: cart,
        total,
        note: deliveryNote
      })
    );

    // Redirect to EXISTING payment URL (unchanged)
    window.location.href = "/payment";
    // or full URL if external:
    // window.location.href = "https://rrnagar.com/payment";
  };

  return (
    <div
      style={{
        width: 320,
        borderLeft: "1px solid #eee",
        padding: 20,
        background: "#fafafa",
        position: "sticky",
        top: 0,
        height: "100vh"
      }}
    >
      <h2>🛒 Cart</h2>

      {cart.length === 0 && (
        <p style={{ color: "#777" }}>No items selected</p>
      )}

      {cart.map((item) => (
        <div key={item.id} style={{ marginBottom: 12 }}>
          <strong>{item.name}</strong>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginTop: 4
            }}
          >
            <button onClick={() => updateQty(item.id, item.qty - 1)}>
              -
            </button>
            <span style={{ margin: "0 10px" }}>{item.qty}</span>
            <button onClick={() => updateQty(item.id, item.qty + 1)}>
              +
            </button>
          </div>
        </div>
      ))}

      <hr />

      <p>
        <strong>Total:</strong> ₹ {Math.round(total)}
      </p>

      {deliveryNote && (
        <p style={{ fontSize: 13, color: "#555" }}>
          🚚 {deliveryNote}
        </p>
      )}

      <button
        disabled={!cart.length}
        onClick={proceed}
        style={{
          marginTop: 12,
          width: "100%",
          padding: "10px 0",
          borderRadius: 6,
          border: "none",
          background: "#003049",
          color: "#fff",
          cursor: "pointer"
        }}
      >
        Proceed to Payment
      </button>
    </div>
  );
}
