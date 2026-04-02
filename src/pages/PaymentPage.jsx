import { useEffect, useMemo, useState } from "react";
import api from "../api/client";
import imageCompression from "browser-image-compression";
import { useLocation, useNavigate } from "react-router-dom";
import { savePendingSubscriptionCandidate } from "../components/SubscriptionPrompt";
import { clearPendingSubscriptionDraft } from "../components/SubscriptionWidget";
import "./PaymentPage.mobile.css";

const PAYMENT_SUBSCRIPTION_PLANS = [
  { period: "monthly", label: "Monthly", discountPercent: 5, months: 1, badge: "Easy Start" },
  { period: "quarterly", label: "3 Months", discountPercent: 7, months: 3, badge: "Most Popular" },
  { period: "half_yearly", label: "6 Months", discountPercent: 9, months: 6, badge: "Better Savings" },
  { period: "yearly", label: "Yearly", discountPercent: 12, months: 12, badge: "Best Value" }
];

function buildPaymentPlans(basePrice) {
  const normalizedPrice = Number(basePrice || 0);
  if (normalizedPrice <= 0) return [];

  return PAYMENT_SUBSCRIPTION_PLANS.map((plan) => {
    const baseCyclePrice = normalizedPrice * plan.months;
    const discountedPrice = Number((baseCyclePrice * (1 - plan.discountPercent / 100)).toFixed(2));
    return {
      ...plan,
      discountedPrice,
      savings: Number((baseCyclePrice - discountedPrice).toFixed(2))
    };
  });
}

export default function PaymentPage() {
  const [method, setMethod] = useState("upi");
  const { state } = useLocation();
  const navigate = useNavigate();

  const orderId = state?.orderId;
  const subscriptionDraft = state?.subscriptionDraft || null;
  const subscriptionCandidate = state?.subscriptionCandidate || null;
  const [txnId, setTxnId] = useState("");
  const [file, setFile] = useState(null);
  const [orderDetails, setOrderDetails] = useState(state?.orderDetails || null);
  const [selectedSubscriptionPeriod, setSelectedSubscriptionPeriod] = useState(state?.selectedSubscriptionPeriod || "");
  const [subscriptionExpanded, setSubscriptionExpanded] = useState(Boolean(state?.selectedSubscriptionPeriod));
  const [upsellExpanded, setUpsellExpanded] = useState(false);
  const [upsellRecommendations, setUpsellRecommendations] = useState([]);
  const [selectedUpsellIds, setSelectedUpsellIds] = useState([]);

  const selectedUpsells = useMemo(
    () => upsellRecommendations.filter((item) => selectedUpsellIds.includes(item.id)),
    [upsellRecommendations, selectedUpsellIds]
  );
  const orderBaseAmount = Number(orderDetails?.totalAmount || state?.orderDetails?.totalAmount || 0);
  const effectiveSubscriptionBasePrice = useMemo(() => {
    const base = Number(subscriptionCandidate?.basePrice || 0);
    const upsellTotal = selectedUpsells.reduce((sum, item) => sum + Number(item.price || 0), 0);
    return Number((base + upsellTotal).toFixed(2));
  }, [selectedUpsells, subscriptionCandidate?.basePrice]);
  const subscriptionPlans = buildPaymentPlans(effectiveSubscriptionBasePrice);
  const selectedSubscriptionPlan = useMemo(
    () => subscriptionPlans.find((plan) => plan.period === selectedSubscriptionPeriod) || null,
    [subscriptionPlans, selectedSubscriptionPeriod]
  );
  const paymentSummary = useMemo(() => {
    if (subscriptionDraft?.pricing) {
      return {
        orderAmount: orderBaseAmount || Number(subscriptionDraft.pricing.totalPayable || 0),
        subscriptionAmount: Number(subscriptionDraft.pricing.totalPayable || 0),
        payableNow: Number(subscriptionDraft.pricing.totalPayable || 0),
        mode: "draft"
      };
    }

    if (selectedSubscriptionPlan) {
      return {
        orderAmount: orderBaseAmount || Number(subscriptionCandidate?.basePrice || 0),
        subscriptionAmount: Number(selectedSubscriptionPlan.discountedPrice || 0),
        payableNow: Number(selectedSubscriptionPlan.discountedPrice || 0),
        mode: "selected_plan"
      };
    }

    return {
      orderAmount: orderBaseAmount || Number(subscriptionCandidate?.basePrice || 0),
      subscriptionAmount: 0,
      payableNow: orderBaseAmount || Number(subscriptionCandidate?.basePrice || 0),
      mode: "order_only"
    };
  }, [orderBaseAmount, selectedSubscriptionPlan, subscriptionCandidate?.basePrice, subscriptionDraft?.pricing]);

  useEffect(() => {
    if (!orderId || orderDetails?.id) return;

    let mounted = true;
    api.get(`/orders/${orderId}`)
      .then((res) => {
        if (!mounted) return;
        const nextOrder = res.data?.order || res.data || null;
        setOrderDetails(nextOrder);
      })
      .catch(() => {
        if (mounted) setOrderDetails(null);
      });

    return () => {
      mounted = false;
    };
  }, [orderDetails?.id, orderId]);

  useEffect(() => {
    if (!subscriptionCandidate?.productId || subscriptionDraft?.id) {
      setUpsellRecommendations([]);
      return;
    }

    let mounted = true;
    api.get("/subscriptions/plans")
      .then((res) => {
        const plans = Array.isArray(res.data?.plans) ? res.data.plans : [];
        const currentCategory = String(subscriptionCandidate?.category || "").toLowerCase();
        const nextRows = plans
          .filter((item) => Number(item.id) !== Number(subscriptionCandidate.productId))
          .filter((item) => {
            if (!currentCategory) return true;
            const itemCategory = String(item.category?.name || item.category || "").toLowerCase();
            return itemCategory === currentCategory;
          })
          .slice(0, 3);
        if (mounted) {
          setUpsellRecommendations(nextRows);
        }
      })
      .catch(() => {
        if (mounted) setUpsellRecommendations([]);
      });

    return () => {
      mounted = false;
    };
  }, [subscriptionCandidate?.productId, subscriptionCandidate?.category, subscriptionDraft?.id]);

  const compressImage = async (imageFile) => {
    const options = {
      maxSizeMB: 0.4,
      maxWidthOrHeight: 1280,
      useWebWorker: true
    };

    try {
      return await imageCompression(imageFile, options);
    } catch (err) {
      console.error("Compression failed:", err);
      return imageFile;
    }
  };

  const submitPayment = async () => {
    if (!orderId) {
      alert("Missing order details. Please return to checkout and try again.");
      navigate("/checkout");
      return;
    }
    if (!file && !txnId) {
      alert("Please provide either a payment screenshot or a transaction ID.");
      return;
    }

    const form = new FormData();
    form.append("orderId", orderId);
    if (file) {
      const compressed = await compressImage(file);
      form.append("paymentScreenshot", compressed);
    }
    if (txnId) {
      form.append("unr", txnId);
    }
    if (subscriptionDraft?.id) {
      form.append("subscriptionDraftId", String(subscriptionDraft.id));
    } else if (selectedSubscriptionPeriod && effectiveSubscriptionBasePrice > 0) {
      if (selectedUpsells.length > 0) {
        const createRes = await api.post("/subscription/create", {
          category: subscriptionCandidate?.category || "general",
          primaryProductId: subscriptionCandidate?.productId,
          duration: selectedSubscriptionPeriod,
          source: "payment_upsell",
          upsellAccepted: true,
          recommendationIds: selectedUpsellIds,
          items: [
            {
              productId: subscriptionCandidate?.productId,
              quantity: Number(subscriptionCandidate?.quantity || 1),
              unitPrice: Number(subscriptionCandidate?.basePrice || 0)
            },
            ...selectedUpsells.map((item) => ({
              productId: item.id,
              quantity: 1,
              unitPrice: Number(item.price || 0)
            }))
          ]
        });
        form.append("subscriptionDraftId", String(createRes.data?.subscription?.id));
      } else {
        form.append("subscriptionPeriod", selectedSubscriptionPeriod);
        form.append("subscriptionBasePrice", String(effectiveSubscriptionBasePrice));
      }
    }

    try {
      await api.post("/orders/submit-payment", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (subscriptionDraft?.id) {
        clearPendingSubscriptionDraft();
      } else if (!selectedSubscriptionPeriod && subscriptionCandidate?.productId) {
        savePendingSubscriptionCandidate(subscriptionCandidate);
      }

      navigate("/payment-success", {
        state: {
          orderId,
          txnId,
          screenshot: file ? URL.createObjectURL(file) : "",
          paymentMethod: method,
          orderDetails,
          subscriptionDraft,
          subscriptionCandidate,
          selectedSubscriptionPeriod,
        }
      });
    } catch (error) {
      console.error("Error submitting payment:", error);
      alert(
        error?.response?.data?.error ||
        error?.response?.data?.msg ||
        error?.message ||
        "Failed to submit payment. Please try again."
      );
    }
  };

  if (!orderId) {
    return (
      <div style={{ padding: 24 }}>
        <h2>Payment</h2>
        <p style={{ color: "#b00018" }}>Missing order details. Please go back to checkout.</p>
        <button
          onClick={() => navigate("/checkout")}
          style={{ padding: "10px 16px", background: "#28a745", color: "#fff", border: "none", borderRadius: 6 }}
        >
          Back to Checkout
        </button>
      </div>
    );
  }

  const toggleUpsell = (id) => {
    setSelectedUpsellIds((current) =>
      current.includes(id) ? current.filter((itemId) => itemId !== id) : [...current, id]
    );
  };

  return (
    <div
      className="payment-page-root"
      style={{
        padding: "40px 20px",
        maxWidth: "760px",
        margin: "0 auto",
        background: "#FFFDE7",
        minHeight: "80vh",
        borderRadius: "18px",
        boxShadow: "0 2px 16px rgba(0,0,0,0.07)"
      }}
    >
      <h2
        className="payment-page-title"
        style={{
          color: "#333",
          marginBottom: "18px",
          fontSize: "28px",
          background: "#FFF9C4",
          padding: "12px 0",
          borderRadius: "10px",
          textAlign: "center",
          boxShadow: "0 1px 6px rgba(0,0,0,0.04)"
        }}
      >
        Complete Your Payment
      </h2>

      <div
        className="payment-card"
        style={{
          background: "#fffaf0",
          padding: "20px",
          borderRadius: "14px",
          marginBottom: "24px",
          border: "1px solid rgba(210, 140, 0, 0.18)",
          boxShadow: "0 8px 22px rgba(194, 120, 0, 0.08)"
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.4, color: "#9a3412" }}>
          Payment Summary
        </div>
        <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", color: "#5A3A00" }}>
            <div>
              <div style={{ fontWeight: 800 }}>Selected product</div>
              <div style={{ fontSize: 13, color: "#8b5e00" }}>
                {subscriptionCandidate?.title || "Current order"}
              </div>
            </div>
            <div style={{ fontWeight: 800 }}>
              Rs {Number(paymentSummary.orderAmount || 0).toFixed(2)}
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", color: "#5A3A00" }}>
            <div>
              <div style={{ fontWeight: 800 }}>Subscription</div>
              <div style={{ fontSize: 13, color: "#8b5e00" }}>
                {subscriptionDraft?.pricing
                  ? `${subscriptionDraft.pricing.durationLabel}${subscriptionDraft.pricing.frequencyLabel ? ` | ${subscriptionDraft.pricing.frequencyLabel}` : ""}${subscriptionDraft.pricing.planLabel ? ` | ${subscriptionDraft.pricing.planLabel}` : ""}`
                  : selectedSubscriptionPlan
                    ? `${selectedSubscriptionPlan.label} plan${selectedUpsells.length ? ` + ${selectedUpsells.length} add-on${selectedUpsells.length === 1 ? "" : "s"}` : ""}`
                    : "Not added"}
              </div>
            </div>
            <div style={{ fontWeight: 800, color: paymentSummary.subscriptionAmount > 0 ? "#9a3412" : "#6b7280" }}>
              {paymentSummary.subscriptionAmount > 0
                ? `Rs ${Number(paymentSummary.subscriptionAmount || 0).toFixed(2)}`
                : "—"}
            </div>
          </div>

          {(subscriptionDraft?.pricing?.items?.length || selectedUpsells.length) ? (
            <details style={{ background: "#fff", borderRadius: 12, padding: "10px 12px", border: "1px solid #f1dfaa" }}>
              <summary style={{ cursor: "pointer", fontWeight: 800, color: "#5A3A00" }}>
                View included subscription items
              </summary>
              <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
                {(subscriptionDraft?.pricing?.items || []).map((item, index) => (
                  <div key={`draft-item-${index}`} style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 14, color: "#6b3f00" }}>
                    <span>{item.title || item.metadata?.title || `Item ${index + 1}`} x {item.quantity}</span>
                    <span>Rs {Number(item.lineTotal || 0).toFixed(2)}</span>
                  </div>
                ))}
                {!subscriptionDraft?.pricing?.items?.length && selectedUpsells.map((item) => (
                  <div key={`upsell-${item.id}`} style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 14, color: "#6b3f00" }}>
                    <span>{item.title} x 1</span>
                    <span>Rs {Number(item.price || 0).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </details>
          ) : null}

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              paddingTop: 10,
              borderTop: "1px dashed #e7c86f"
            }}
          >
            <div>
              <div style={{ fontWeight: 900, fontSize: 18, color: "#5A3A00" }}>Total payable now</div>
              <div style={{ fontSize: 13, color: "#8b5e00" }}>
                {paymentSummary.mode === "selected_plan"
                  ? "The selected subscription amount becomes the payable amount for this payment."
                  : paymentSummary.mode === "draft"
                    ? "Your compact subscription setup is already included in this payable amount."
                    : "This is the amount to be approved after payment verification."}
              </div>
            </div>
            <div style={{ fontWeight: 900, fontSize: 24, color: "#C8102E" }}>
              Rs {Number(paymentSummary.payableNow || 0).toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      <div className="payment-methods" style={{ marginBottom: 24, background: "#FFF9C4", padding: "12px", borderRadius: "10px" }}>
        <label className="payment-method-label" style={{ fontWeight: 600, fontSize: 17, marginRight: 18 }}>
          <input type="radio" value="upi" checked={method === "upi"} onChange={() => setMethod("upi")} /> UPI
        </label>
        <label className="payment-method-label" style={{ fontWeight: 600, fontSize: 17 }}>
          <input type="radio" value="pi" checked={method === "pi"} onChange={() => setMethod("pi")} /> Pi Network
        </label>
      </div>

      {method === "upi" && (
        <div className="payment-card" style={{ background: "#FFF9C4", padding: 18, borderRadius: 10, marginBottom: 24, boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>
          <h3 style={{ margin: 0, fontSize: 18 }}>Pay via UPI</h3>
          <div style={{ margin: "12px 0", display: "flex", justifyContent: "center" }}>
            <img src="/UPI QR Code.jpeg" alt="UPI QR Code" style={{ width: 200, height: 200, borderRadius: 8, border: "1.5px solid #007bff", objectFit: "contain" }} />
          </div>
          <div style={{ fontSize: 14, color: "#555", textAlign: "center" }}>
            Scan the QR code above to make payment. Then upload your payment screenshot and enter the UPI transaction ID below.
          </div>
        </div>
      )}

      {method === "pi" && (
        <div className="payment-card" style={{ background: "#FFF9C4", padding: 18, borderRadius: 10, marginBottom: 24, boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>
          <h3 style={{ margin: 0, fontSize: 18 }}>Pay via Pi Network</h3>
          <div style={{ margin: "12px 0", display: "flex", justifyContent: "center" }}>
            <img src="/Pi network QR code.jpg" alt="Pi Network QR Code" style={{ width: 200, height: 200, borderRadius: 8, border: "1.5px solid #007bff", objectFit: "contain" }} />
          </div>
          <div style={{ fontSize: 14, color: "#555", textAlign: "center" }}>
            Scan the QR code above with Pi Network app to make payment. Then upload your payment screenshot and enter the Pi transaction ID below.
          </div>
        </div>
      )}

      {subscriptionDraft?.pricing ? (
        <div
          className="payment-card"
          style={{
            background: "linear-gradient(135deg, #fff8cc 0%, #ffe78a 52%, #ffd55c 100%)",
            padding: "24px",
            borderRadius: "16px",
            marginBottom: "24px",
            boxShadow: "0 10px 28px rgba(194, 120, 0, 0.12)",
            border: "1px solid rgba(210, 140, 0, 0.2)"
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.4, color: "#9a3412" }}>
            Subscription included
          </div>
          <h3 style={{ margin: "8px 0 6px", fontSize: "28px", lineHeight: 1.05, color: "#5A3A00" }}>
            Subscription locked into this payment
          </h3>
          <p style={{ margin: 0, color: "#6b3f00", lineHeight: 1.6 }}>
            This payment covers your selected subscription setup. We will activate it only after payment approval.
          </p>
          <div style={{ display: "grid", gap: 10, marginTop: 16 }}>
            <div style={{ background: "rgba(255,255,255,0.84)", borderRadius: 14, padding: 14 }}>
              <div style={{ fontWeight: 800, color: "#5A3A00" }}>
                {subscriptionDraft.pricing.durationLabel}
                {subscriptionDraft.pricing.frequencyLabel ? ` | ${subscriptionDraft.pricing.frequencyLabel}` : ""}
                {subscriptionDraft.pricing.planLabel ? ` | ${subscriptionDraft.pricing.planLabel}` : ""}
              </div>
              <div style={{ marginTop: 6, color: "#6b3f00" }}>
                {subscriptionDraft.pricing.itemCount} item{subscriptionDraft.pricing.itemCount === 1 ? "" : "s"} included
              </div>
              <div style={{ marginTop: 6, fontWeight: 800, color: "#9a3412" }}>
                Pay Rs {Number(subscriptionDraft.pricing.totalPayable || 0).toFixed(2)} now and save Rs {Number(subscriptionDraft.pricing.savings || 0).toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      ) : subscriptionPlans.length > 0 && (
        <div
          className="payment-card"
          style={{
            background: "linear-gradient(135deg, #fff8cc 0%, #ffe78a 52%, #ffd55c 100%)",
            padding: "24px",
            borderRadius: "16px",
            marginBottom: "24px",
            boxShadow: "0 10px 28px rgba(194, 120, 0, 0.12)",
            border: "1px solid rgba(210, 140, 0, 0.2)"
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.4, color: "#9a3412" }}>
            Add With This Payment
          </div>
          <h3 style={{ margin: "8px 0 6px", fontSize: "28px", lineHeight: 1.05, color: "#5A3A00" }}>
            Subscribe and Forget
          </h3>
          <p style={{ margin: 0, color: "#6b3f00", lineHeight: 1.6 }}>
            Lock this into your payment now. We will remind you before every cycle and deliver on schedule, so you never have to reorder {subscriptionCandidate?.title || "this product"} manually again.
          </p>

          <button
            type="button"
            onClick={() => setSubscriptionExpanded((current) => !current)}
            style={{
              marginTop: 16,
              width: "100%",
              padding: "12px 14px",
              borderRadius: 14,
              border: "1px solid rgba(210, 140, 0, 0.2)",
              background: "rgba(255,255,255,0.82)",
              cursor: "pointer",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontWeight: 800,
              color: "#5A3A00"
            }}
          >
            <span>
              {selectedSubscriptionPeriod
                ? `Included: ${subscriptionPlans.find((plan) => plan.period === selectedSubscriptionPeriod)?.label || "Plan"}${selectedUpsells.length ? ` + ${selectedUpsells.length} add-on${selectedUpsells.length === 1 ? "" : "s"}` : ""}`
                : "Choose subscription plan"}
            </span>
            <span>{subscriptionExpanded ? "▲" : "▼"}</span>
          </button>

          {subscriptionExpanded && (
            <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
              <div
                style={{
                  background: "rgba(255,255,255,0.78)",
                  borderRadius: 14,
                  padding: "14px 16px",
                  border: "1px solid rgba(210, 140, 0, 0.16)"
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 800, textTransform: "uppercase", color: "#9a3412", marginBottom: 8 }}>
                  Step 1
                </div>
                <div style={{ fontWeight: 800, color: "#5A3A00", marginBottom: 8 }}>
                  Select plan duration
                </div>
                <select
                  value={selectedSubscriptionPeriod}
                  onChange={(event) => setSelectedSubscriptionPeriod(event.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: 12,
                    border: "1px solid rgba(210, 140, 0, 0.2)",
                    fontWeight: 700
                  }}
                >
                  <option value="">No subscription</option>
                  {subscriptionPlans.map((plan) => (
                    <option key={plan.period} value={plan.period}>
                      {plan.label} | Save {plan.discountPercent}% | Rs {plan.discountedPrice.toFixed(2)}
                    </option>
                  ))}
                </select>
                {selectedSubscriptionPeriod && (
                  <div style={{ marginTop: 8, fontSize: 13, color: "#8b5e00" }}>
                    {subscriptionPlans.find((plan) => plan.period === selectedSubscriptionPeriod)?.badge || "Value plan"} | Recurring delivery stays handled after approval.
                  </div>
                )}
              </div>

              {upsellRecommendations.length > 0 && selectedSubscriptionPeriod && (
                <div
                  style={{
                    background: "rgba(255,255,255,0.78)",
                    borderRadius: 14,
                    padding: "14px 16px",
                    border: "1px solid rgba(210, 140, 0, 0.16)"
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setUpsellExpanded((current) => !current)}
                    style={{
                      width: "100%",
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: 0,
                      color: "#5A3A00"
                    }}
                  >
                    <span>
                      <span style={{ display: "block", fontSize: 13, fontWeight: 800, textTransform: "uppercase", color: "#9a3412" }}>
                        Step 2
                      </span>
                      <span style={{ display: "block", fontWeight: 800, marginTop: 4 }}>
                        Add more products to this subscription
                      </span>
                    </span>
                    <span>{upsellExpanded ? "▲" : "▼"}</span>
                  </button>
                  {upsellExpanded && (
                    <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
                      {upsellRecommendations.map((item) => {
                        const active = selectedUpsellIds.includes(item.id);
                        return (
                          <label
                            key={item.id}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              gap: 12,
                              background: active ? "#fff7d6" : "#fff",
                              border: active ? "1px solid #C8102E" : "1px solid #eee",
                              borderRadius: 12,
                              padding: "12px 14px",
                              cursor: "pointer"
                            }}
                          >
                            <div>
                              <div style={{ fontWeight: 800, color: "#5A3A00" }}>{item.title}</div>
                              <div style={{ marginTop: 4, fontSize: 13, color: "#8b5e00" }}>
                                Rs {Number(item.price || 0).toFixed(2)} {item.unit ? `| ${item.unit}` : ""}
                              </div>
                            </div>
                            <input
                              type="checkbox"
                              checked={active}
                              onChange={() => toggleUpsell(item.id)}
                            />
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
            {[
              "We remind before dispatch",
              "No need to reorder manually",
              "Recurring delivery on schedule"
            ].map((point) => (
              <div
                key={point}
                style={{
                  padding: "8px 12px",
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.7)",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#6b3f00"
                }}
              >
                {point}
              </div>
            ))}
          </div>

          {selectedSubscriptionPeriod && (
            <div style={{ marginTop: 12, color: "#9a3412", fontWeight: 700 }}>
              Total subscription payable: Rs {Number(subscriptionPlans.find((plan) => plan.period === selectedSubscriptionPeriod)?.discountedPrice || 0).toFixed(2)}
            </div>
          )}
        </div>
      )}

      <div
        className="payment-card"
        style={{
          background: "#FFF9C4",
          padding: "25px",
          borderRadius: "12px",
          marginBottom: "25px",
          boxShadow: "0 1px 6px rgba(0,0,0,0.04)"
        }}
      >
        <h3 style={{ marginBottom: "15px", fontSize: "18px" }}>Step 1: Upload Payment Screenshot</h3>

        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files[0])}
          className="payment-file-input"
          style={{
            padding: "10px",
            border: "2px dashed #ddd",
            borderRadius: "8px",
            width: "100%",
            marginBottom: "15px",
            cursor: "pointer"
          }}
        />
      </div>

      <div
        className="payment-card"
        style={{
          background: "#FFF9C4",
          padding: "25px",
          borderRadius: "12px",
          boxShadow: "0 1px 6px rgba(0,0,0,0.04)"
        }}
      >
        <h3 style={{ marginBottom: "15px", fontSize: "18px" }}>Step 2: Enter Transaction ID</h3>
        <input
          type="text"
          placeholder={method === "upi" ? "Enter UPI Transaction ID" : "Enter Pi Transaction ID"}
          value={txnId}
          onChange={(e) => setTxnId(e.target.value)}
          className="payment-text-input"
          style={{
            padding: "12px",
            width: "100%",
            border: "2px solid #ddd",
            borderRadius: "6px",
            fontSize: "16px",
            marginBottom: "15px"
          }}
        />
        <button
          className="payment-submit-btn"
          onClick={submitPayment}
          style={{
            padding: "14px 28px",
            background: "#28a745",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "18px",
            fontWeight: "bold",
            width: "100%"
          }}
        >
          Submit Payment
        </button>
      </div>

      <div
        style={{
          marginTop: "25px",
          padding: "15px",
          background: "#FFF9C4",
          border: "1px solid #ffc107",
          borderRadius: "8px",
          boxShadow: "0 1px 6px rgba(0,0,0,0.04)"
        }}
      >
        <p style={{ color: "#856404", margin: 0, fontSize: "14px" }}>
          <strong>Tip:</strong> Make sure your transaction ID is correct. You will receive confirmation once payment is verified{selectedSubscriptionPeriod ? ", and your subscription will activate with approval." : "."}
        </p>
      </div>
    </div>
  );
}
