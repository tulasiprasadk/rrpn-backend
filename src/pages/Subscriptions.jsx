import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import CategoryLayout from "../components/CategoryLayout";
import SubscriptionPopup from "../components/subscription/SubscriptionPopup";
import api from "../api/client";
import { fetchSubscriptionPlans } from "../api/subscriptionApi";
import { normalizeSubscriptionCategory } from "../components/subscription/subscriptionConfig";

function buildAddressText(address) {
  return [
    address?.addressLine,
    address?.city,
    address?.state,
    address?.pincode ? `- ${address.pincode}` : ""
  ]
    .filter(Boolean)
    .join(", ");
}

export default function Subscriptions() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeProduct, setActiveProduct] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError("");
      try {
        // Use fetchSubscriptionPlans which has a built-in fallback when the backend times out
        const planProducts = await fetchSubscriptionPlans();
        if (!mounted) return;
        setProducts(planProducts);
      } catch (err) {
        if (mounted) {
          setError(err.response?.data?.error || err.message || "Failed to load subscription products");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const listedProducts = useMemo(() => {
    const excluded = ["crackers", "local services", "consultancy"];
    return products
      .filter((product) => {
        const category = normalizeSubscriptionCategory(product.category?.name || product.category || "");
        return !excluded.includes(category);
      })
      .sort((a, b) => String(a.title || "").localeCompare(String(b.title || "")));
  }, [products]);

  const rationProducts = useMemo(
    () => listedProducts.filter((product) => normalizeSubscriptionCategory(product.category?.name || product.category || "") === "ration"),
    [listedProducts]
  );

  const regularProducts = useMemo(
    () => listedProducts.filter((product) => normalizeSubscriptionCategory(product.category?.name || product.category || "") !== "ration"),
    [listedProducts]
  );

  const startSubscriptionPayment = async ({ draft, items, pricing }) => {
    try {
      const addressRes = await api.get("/customer/address");
      const addresses = Array.isArray(addressRes.data) ? addressRes.data : [];
      const defaultAddress = addresses.find((item) => item.isDefault) || addresses[0] || null;
      if (!defaultAddress) {
        alert("Please save a delivery address before starting a subscription payment.");
        navigate("/address");
        return;
      }

      const orderRes = await api.post("/orders/create", {
        productId: activeProduct.id,
        qty: 1,
        subscriptionDraftId: draft?.id,
        addressId: defaultAddress.id,
        customerName: defaultAddress.name || "",
        customerPhone: defaultAddress.phone || "",
        customerAddress: buildAddressText(defaultAddress),
        promoCode: null,
        discount: 0
      });

      navigate("/payment", {
        state: {
          orderId: orderRes.data.orderId,
          orderDetails: orderRes.data,
          subscriptionDraft: {
            id: draft?.id,
            pricing,
            items,
            productId: activeProduct.id
          },
          subscriptionCandidate: {
            productId: activeProduct.id,
            title: activeProduct.title || "Product",
            category: normalizeSubscriptionCategory(activeProduct.category?.name || activeProduct.category || ""),
            basePrice: Number(activeProduct.price || 0),
            quantity: 1,
            unit: activeProduct.unit || ""
          },
          subscriptionCandidates: [
            {
              productId: activeProduct.id,
              title: activeProduct.title || "Product",
              category: normalizeSubscriptionCategory(activeProduct.category?.name || activeProduct.category || ""),
              basePrice: Number(activeProduct.price || 0),
              quantity: 1,
              unit: activeProduct.unit || ""
            }
          ],
          cartItems: items.map((item, index) => ({
            id: item.productId || `subscription-item-${index}`,
            title: item.title,
            price: Number(item.unitPrice || 0),
            quantity: Number(item.quantity || 1),
            unit: item.unit || ""
          }))
        }
      });
    } catch (err) {
      alert(err.response?.data?.error || err.message || "Failed to start subscription payment");
    }
  };

  return (
    <CategoryLayout title="Subscriptions" category="subscriptions">
      <div style={{ padding: "24px 32px" }}>
        <h1 style={{ marginBottom: 10, color: "#C8102E" }}>Subscriptions</h1>
        <p style={{ marginBottom: 10, color: "#555" }}>
          Pick a basket or service first, review a short guided setup, then continue to payment.
        </p>
        <p style={{ marginBottom: 24, color: "#7a2034", fontWeight: 700 }}>
          Subscription activates only after payment is verified and approved.
        </p>

        {loading && <div>Loading subscription products...</div>}
        {error && <div style={{ color: "#C8102E", marginBottom: 12 }}>{error}</div>}

        {!loading && !error && listedProducts.length === 0 && (
          <div style={{ color: "#777" }}>No subscription products available yet.</div>
        )}

        {!loading && listedProducts.length > 0 && (
          <div style={{ display: "grid", gap: 24 }}>
            {rationProducts.length > 0 && (
              <section
                style={{
                  background: "linear-gradient(135deg, #fff5cf 0%, #ffe58f 100%)",
                  border: "1px solid #f2d060",
                  borderRadius: 18,
                  padding: 18
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 14 }}>
                  <div>
                    <div style={{ color: "#8b5e00", fontSize: 12, fontWeight: 900, textTransform: "uppercase", letterSpacing: 0.7 }}>
                      Highlighted Category
                    </div>
                    <div style={{ color: "#C8102E", fontSize: 28, fontWeight: 900, marginTop: 4 }}>Ration Plans</div>
                    <div style={{ color: "#6b4b00", marginTop: 6, maxWidth: 720 }}>
                      A shorter, clearer way to subscribe: choose one ready monthly basket instead of building a long custom slab.
                    </div>
                  </div>
                  <div style={{ alignSelf: "center", color: "#7a2034", fontWeight: 800 }}>
                    {rationProducts.length} curated basket{rationProducts.length === 1 ? "" : "s"}
                  </div>
                </div>

                <div style={{ display: "grid", gap: 12 }}>
                  {rationProducts.map((product) => (
                    <div
                      key={product.id}
                      style={{
                        background: "#fffdf4",
                        borderRadius: 16,
                        padding: 16,
                        border: "1px solid #f0d995",
                        display: "grid",
                        gridTemplateColumns: "minmax(220px, 1.2fr) minmax(220px, 0.9fr) auto",
                        gap: 14,
                        alignItems: "center"
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 900, color: "#5A3A00", fontSize: 22 }}>{product.title}</div>
                        <div style={{ color: "#8b5e00", fontSize: 13, marginTop: 4 }}>
                          {product.metadata?.badge || "Monthly ration"} {product.metadata?.itemCount ? `| ${product.metadata.itemCount} items` : ""}
                        </div>
                        <div style={{ color: "#666", fontSize: 14, marginTop: 8 }}>
                          {product.description}
                        </div>
                      </div>

                      <div>
                        <div style={{ color: "#C8102E", fontWeight: 900, fontSize: 24 }}>
                          Rs {Number(product.price || 0).toFixed(2)}
                        </div>
                        <div style={{ marginTop: 6, fontSize: 13, color: "#8b5e00" }}>
                          Choose a duration, preview what is included, and continue in one simple flow.
                        </div>
                      </div>

                      <button
                        onClick={() => setActiveProduct(product)}
                        style={{
                          background: "linear-gradient(135deg, #C8102E 0%, #9f1239 100%)",
                          color: "#fff",
                          border: "none",
                          padding: "12px 16px",
                          borderRadius: 10,
                          cursor: "pointer",
                          fontWeight: 800,
                          minWidth: 190
                        }}
                      >
                        Choose Ration Plan
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {regularProducts.length > 0 && (
              <section>
                <div style={{ color: "#C8102E", fontWeight: 900, fontSize: 22, marginBottom: 12 }}>
                  More Subscription Options
                </div>
                <div style={{ display: "grid", gap: 12 }}>
                  {regularProducts.map((product) => (
                    <div
                      key={product.id}
                      style={{
                        background: "#FFF9C4",
                        borderRadius: 14,
                        padding: 16,
                        border: "1px solid #F2D060",
                        display: "grid",
                        gridTemplateColumns: "minmax(220px, 1.2fr) minmax(160px, 0.8fr) auto",
                        gap: 14,
                        alignItems: "center"
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 800, color: "#C8102E", fontSize: 20 }}>{product.title}</div>
                        <div style={{ color: "#666", fontSize: 13, marginTop: 4 }}>
                          {product.category?.name || "Category"} {product.unit ? `| ${product.unit}` : ""}
                        </div>
                      </div>

                      <div>
                        <div style={{ color: "#5A3A00", fontWeight: 800 }}>
                          Base price: Rs {Number(product.price || 0).toFixed(2)}
                        </div>
                        <div style={{ marginTop: 4, fontSize: 13, color: "#8b5e00" }}>
                          Configure duration, frequency, plan, and upsell inside the popup.
                        </div>
                      </div>

                      <button
                        onClick={() => setActiveProduct(product)}
                        style={{
                          background: "#C8102E",
                          color: "#fff",
                          border: "none",
                          padding: "12px 16px",
                          borderRadius: 10,
                          cursor: "pointer",
                          fontWeight: 800,
                          minWidth: 180
                        }}
                      >
                        Configure Subscription
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>

      <SubscriptionPopup
        open={Boolean(activeProduct)}
        onClose={() => setActiveProduct(null)}
        product={activeProduct}
        quantity={1}
        onConfirmed={startSubscriptionPayment}
      />
    </CategoryLayout>
  );
}
