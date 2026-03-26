import React, { useEffect, useState } from "react";
import api from "../../api/client";

export default function CheckoutMarketing() {
  const [offersText, setOffersText] = useState("[]");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadOffers();
  }, []);

  const loadOffers = async () => {
    try {
      const offersRes = await api.get("/admin/config/checkout_offers");
      setOffersText(JSON.stringify(offersRes.data?.value || [], null, 2));
      setMessage("");
    } catch (err) {
      try {
        const offersRes = await api.get("/cms/checkout-offers");
        setOffersText(JSON.stringify(offersRes.data || [], null, 2));
        setMessage("Viewing public offer data. Login to edit.");
      } catch (fallbackErr) {
        setOffersText("[]");
        setMessage("Create offers and click Save.");
      }
    }
  };

  const saveOffers = async () => {
    let parsed;
    try {
      parsed = JSON.parse(offersText);
    } catch (err) {
      setMessage(`Invalid JSON: ${err.message}`);
      return;
    }

    setSaving(true);
    setMessage("");
    try {
      await api.put("/admin/config/checkout_offers", {
        value: parsed,
        type: "json",
        category: "cms"
      });
      setMessage("Offers saved successfully.");
    } catch (err) {
      setMessage(err.response?.data?.error || "Failed to save offers.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1 style={{ marginBottom: 8 }}>Checkout Offers</h1>
      <p style={{ color: "#666", marginBottom: 20 }}>
        Manage promo offers shown during checkout. Advertisement management now stays in the separate Advertisements section.
      </p>

      {message && (
        <div style={{ marginBottom: 16, padding: 10, background: "#fff3cd", borderRadius: 6 }}>
          {message}
        </div>
      )}

      <section style={{ background: "#fff", padding: 16, borderRadius: 8, border: "1px solid #eee" }}>
        <h2 style={{ marginTop: 0 }}>Offers</h2>
        <p style={{ fontSize: 12, color: "#666" }}>
          JSON array: [{"{"}"title","description","code","type","value"{"}"}]. Type can be "percent" or "flat".
        </p>
        <textarea
          rows={14}
          style={{ width: "100%", fontFamily: "monospace", fontSize: 12 }}
          value={offersText}
          onChange={(event) => setOffersText(event.target.value)}
        />
        <button
          onClick={saveOffers}
          disabled={saving}
          style={{ marginTop: 10, padding: "8px 14px" }}
        >
          {saving ? "Saving..." : "Save Offers"}
        </button>
      </section>
    </div>
  );
}
