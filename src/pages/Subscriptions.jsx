import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../config/api";
import { useAuth } from "../context/AuthContext";
import CartPanel from "../components/CartPanel";
import api from "../api/client";

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
  const [submittingProductId, setSubmittingProductId] = useState(null);
  const [selectedPeriods, setSelectedPeriods] = useState({});
  const [error, setError] = useState("");
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/subscriptions/plans`, { credentials: "include" });
        if (!res.ok) throw new Error("Failed to load subscription plans");
        const data = await res.json();
        const planProducts = Array.isArray(data?.plans) ? data.plans : [];

        if (!mounted) return;

        setProducts(planProducts);
        setSelectedPeriods(
          planProducts.reduce((acc, product) => {
            acc[product.id] = product.plans?.[0]?.period || "";
            return acc;
          }, {})
        );
      } catch (err) {
        if (mounted) setError(err.message || "Failed to load subscription plans");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const groupedProducts = useMemo(() => {
    return products
      .slice()
      .sort((a, b) => String(a.title || "").localeCompare(String(b.title || "")));
  }, [products]);

  const continueToPayment = async (product) => {
    if (!user) {
      navigate("/login");
      return;
    }

    const period = selectedPeriods[product.id];
    const selectedPlan = product.plans?.find((plan) => plan.period === period) || product.plans?.[0];
    if (!selectedPlan) {
      setError("Please choose a subscription plan.");
      return;
    }

    setSubmittingProductId(product.id);
    setError("");

    try {
      const [addressRes, profileRes] = await Promise.all([
        api.get("/customer/address"),
        api.get("/customer/profile").catch(() => ({ data: {} }))
      ]);

      const addresses = Array.isArray(addressRes.data) ? addressRes.data : [];
      const defaultAddress = addresses.find((item) => item.isDefault) || addresses[0] || null;

      if (!defaultAddress) {
        alert("Please save a delivery address before starting a subscription payment.");
        navigate("/address");
        return;
      }

      const profile = profileRes.data || {};
      const orderPayload = {
        productId: product.id,
        qty: 1,
        addressId: defaultAddress.id,
        customerName: defaultAddress.name || profile.name || user?.name || "",
        customerPhone: defaultAddress.phone || profile.mobile || profile.username || user?.phone || "",
        customerAddress: buildAddressText(defaultAddress),
        promoCode: null,
        discount: 0,
      };

      const orderRes = await api.post("/orders/create", orderPayload);

      navigate("/payment", {
        state: {
          orderId: orderRes.data.orderId,
          orderDetails: orderRes.data,
          selectedSubscriptionPeriod: selectedPlan.period,
          subscriptionCandidate: {
            productId: product.id,
            title: product.title,
            basePrice: Number(product.price || 0),
            quantity: 1,
          },
        }
      });
    } catch (err) {
      console.error("Subscription payment start failed:", err);
      setError(err.response?.data?.error || err.message || "Failed to start subscription payment");
    } finally {
      setSubmittingProductId(null);
    }
  };

  return (
    <div className="with-cart-panel" style={{ minHeight: "100vh", background: "#FFFDE7" }}>
      <div style={{ flex: 1, padding: "24px 32px" }}>
        <h1 style={{ marginBottom: 12, color: "#C8102E" }}>Subscriptions</h1>
        <p style={{ marginBottom: 10, color: "#555" }}>
          Pick a product, choose a plan from the dropdown, and continue to payment.
        </p>
        <p style={{ marginBottom: 24, color: "#7a2034", fontWeight: 700 }}>
          Subscription activates only after payment is verified and approved.
        </p>

        {loading && <div>Loading subscription plans...</div>}
        {error && <div style={{ color: "#C8102E", marginBottom: 12 }}>{error}</div>}

        {!loading && !error && groupedProducts.length === 0 && (
          <div style={{ color: "#777" }}>No subscription products available yet.</div>
        )}

        {!loading && groupedProducts.length > 0 && (
          <div style={{ display: "grid", gap: 14 }}>
            {groupedProducts.map((product) => {
              const selectedPlan =
                product.plans?.find((plan) => plan.period === selectedPeriods[product.id]) ||
                product.plans?.[0] ||
                null;

              return (
                <div
                  key={product.id}
                  style={{
                    background: "#FFF9C4",
                    borderRadius: 14,
                    padding: 16,
                    border: "1px solid #F2D060",
                    display: "grid",
                    gridTemplateColumns: "minmax(220px, 1.3fr) minmax(180px, 0.9fr) minmax(220px, 1fr) auto",
                    gap: 14,
                    alignItems: "center"
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 800, color: "#C8102E", fontSize: 20 }}>
                      {product.title}
                    </div>
                    <div style={{ color: "#666", fontSize: 13, marginTop: 4 }}>
                      {product.category?.name || "Category"} {product.variety ? `| ${product.variety}` : ""} {product.unit ? `| ${product.unit}` : ""}
                    </div>
                    <div style={{ color: "#5A3A00", marginTop: 8, fontWeight: 700 }}>
                      Base price: Rs {Number(product.price || 0).toFixed(2)}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 12, textTransform: "uppercase", color: "#8b5e00", fontWeight: 800, marginBottom: 6 }}>
                      Choose Plan
                    </div>
                    <select
                      value={selectedPeriods[product.id] || ""}
                      onChange={(event) =>
                        setSelectedPeriods((current) => ({
                          ...current,
                          [product.id]: event.target.value
                        }))
                      }
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: 10,
                        border: "1px solid #d4b14c",
                        fontWeight: 700
                      }}
                    >
                      {product.plans?.map((plan) => (
                        <option key={`${product.id}-${plan.period}`} value={plan.period}>
                          {plan.label} | Save {plan.discountPercent}%
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    {selectedPlan && (
                      <>
                        <div style={{ fontWeight: 800, color: "#5A3A00" }}>
                          Rs {Number(selectedPlan.discountedPrice || 0).toFixed(2)} for {selectedPlan.label.toLowerCase()}
                        </div>
                        <div style={{ color: "#666", fontSize: 13, marginTop: 4 }}>
                          Save Rs {Number(selectedPlan.savings || 0).toFixed(2)} with recurring delivery.
                        </div>
                        <div style={{ color: "#7a2034", fontSize: 13, marginTop: 6, fontWeight: 700 }}>
                          Pay first. Activate after approval.
                        </div>
                      </>
                    )}
                  </div>

                  <button
                    disabled={submittingProductId === product.id}
                    onClick={() => continueToPayment(product)}
                    style={{
                      background: submittingProductId === product.id ? "#ccc" : "#C8102E",
                      color: "#fff",
                      border: "none",
                      padding: "12px 16px",
                      borderRadius: 10,
                      cursor: submittingProductId === product.id ? "not-allowed" : "pointer",
                      fontWeight: 800,
                      minWidth: 170
                    }}
                  >
                    {submittingProductId === product.id ? "Preparing..." : "Continue to Payment"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <div style={{ position: "sticky", top: 32, alignSelf: "flex-start", height: "fit-content", zIndex: 10 }}>
        <CartPanel />
      </div>
    </div>
  );
}
