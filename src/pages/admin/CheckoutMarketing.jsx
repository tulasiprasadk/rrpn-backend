import React, { useEffect, useState } from "react";
import api from "../../api/client";

export default function CheckoutMarketing() {
  const [offersText, setOffersText] = useState("[]");
  const [offersPreview, setOffersPreview] = useState([]);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadOffers();
  }, []);

  const loadOffers = async () => {
    try {
      const [adminConfigRes, publicOffersRes] = await Promise.all([
        api.get("/admin/config/checkout_offers").catch(() => ({ data: { value: [] } })),
        api.get("/cms/checkout-offers").catch(() => ({ data: [] }))
      ]);

      const adminOffers = Array.isArray(adminConfigRes.data?.value) ? adminConfigRes.data.value : [];
      const publicOffers = Array.isArray(publicOffersRes.data) ? publicOffersRes.data : [];
      const mergedOffers = adminOffers.length > 0 ? adminOffers : publicOffers;

      setOffersPreview(mergedOffers);
      setOffersText(JSON.stringify(mergedOffers, null, 2));
      setMessage(mergedOffers.length > 0 ? "" : "Create offers and click Save.");
    } catch (err) {
      setOffersPreview([]);
      setOffersText("[]");
      setMessage("Create offers and click Save.");
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
      setOffersPreview(Array.isArray(parsed) ? parsed : []);
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
        {offersPreview.length > 0 && (
          <div style={{ marginBottom: 16, display: "grid", gap: 10 }}>
            {offersPreview.map((offer, index) => (
              <div key={`${offer.code || offer.title || "offer"}-${index}`} style={{ padding: 12, background: "#f8f9fa", borderRadius: 8 }}>
                <strong>{offer.title || `Offer ${index + 1}`}</strong>
                {offer.description && <div style={{ marginTop: 4 }}>{offer.description}</div>}
                <div style={{ marginTop: 4, fontSize: 13, color: "#555" }}>
                  {offer.code ? `Code: ${offer.code} | ` : ""}
                  {offer.type || "percent"} {offer.value ?? 0}
                </div>
              </div>
            ))}
          </div>
        )}
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
