import { useEffect, useMemo, useState } from "react";
import api from "../api/client";
import imageCompression from "browser-image-compression";
import { useLocation, useNavigate } from "react-router-dom";
import { savePendingSubscriptionCandidate } from "../components/SubscriptionPrompt";
import {
  calculateSubscriptionPreview,
  getFrequencyConfig,
  GROCERY_PLANS,
  normalizeSubscriptionCategory
} from "../components/subscription/subscriptionConfig";
import "./PaymentPage.mobile.css";

const SUBSCRIPTION_MODES = {
  repeat_item: "repeat_item",
  ration: "ration"
};

const REPEAT_FREQUENCY_OPTIONS = [
  { value: "monthly_4", label: "4 times/month", hint: "Weekly repeat delivery" },
  { value: "monthly_15", label: "15 times/month", hint: "Frequent repeat delivery" },
  { value: "monthly_30", label: "30 times/month", hint: "Daily repeat delivery" }
];

function clearPendingSubscriptionDraft() {
  localStorage.removeItem("pendingSubscriptionDraft");
}

const PAYMENT_SUBSCRIPTION_PLANS = [
  { period: "monthly", label: "Monthly", discountPercent: 5, months: 1, badge: "Easy Start" },
  { period: "quarterly", label: "3 Months", discountPercent: 7, months: 3, badge: "Most Popular" },
  { period: "half_yearly", label: "6 Months", discountPercent: 9, months: 6, badge: "Better Savings" },
  { period: "yearly", label: "Yearly", discountPercent: 12, months: 12, badge: "Best Value" }
];

function buildPaymentPlans(basePrice, frequencyValue = "monthly_4") {
  const normalizedPrice = Number(basePrice || 0);
  if (normalizedPrice <= 0) return [];
  const occurrencesPerMonth = Number(getFrequencyConfig(frequencyValue)?.occurrencesPerMonth || 1);

  return PAYMENT_SUBSCRIPTION_PLANS.map((plan) => {
    const baseCyclePrice = normalizedPrice * occurrencesPerMonth * plan.months;
    const discountedPrice = Number((baseCyclePrice * (1 - plan.discountPercent / 100)).toFixed(2));
    return {
      ...plan,
      discountedPrice,
      savings: Number((baseCyclePrice - discountedPrice).toFixed(2))
    };
  });
}

function uniqSubscriptionCandidates(rows = []) {
  const seen = new Set();
  return rows.filter((row) => {
    const key = String(row.productId || row.id || "");
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export default function PaymentPage() {
  const [method, setMethod] = useState("upi");
  const { state } = useLocation();
  const navigate = useNavigate();

  const orderId = state?.orderId;
  const subscriptionDraft = state?.subscriptionDraft || null;
  const fallbackSubscriptionCandidate = state?.subscriptionCandidate || null;
  const cartItems = Array.isArray(state?.cartItems) ? state.cartItems : [];
  const [txnId, setTxnId] = useState("");
  const [file, setFile] = useState(null);
  const [orderDetails, setOrderDetails] = useState(state?.orderDetails || null);
  const [selectedSubscriptionPeriod, setSelectedSubscriptionPeriod] = useState(state?.selectedSubscriptionPeriod || "");
  const [subscriptionExpanded, setSubscriptionExpanded] = useState(Boolean(state?.selectedSubscriptionPeriod));
  const [upsellExpanded, setUpsellExpanded] = useState(false);
  const [upsellRecommendations, setUpsellRecommendations] = useState([]);
  const [selectedUpsellIds, setSelectedUpsellIds] = useState([]);
  const [grocerySubscriptionMode, setGrocerySubscriptionMode] = useState(SUBSCRIPTION_MODES.repeat_item);
  const [selectedRepeatFrequency, setSelectedRepeatFrequency] = useState("monthly_4");
  const [selectedGroceryPlan, setSelectedGroceryPlan] = useState(GROCERY_PLANS[0].value);

  const subscriptionCandidates = useMemo(() => {
    const rows =
      Array.isArray(state?.subscriptionCandidates) && state.subscriptionCandidates.length
        ? state.subscriptionCandidates
        : fallbackSubscriptionCandidate
          ? [fallbackSubscriptionCandidate]
          : [];

    return uniqSubscriptionCandidates(
      rows.map((item) => ({
        productId: Number(item.productId || item.id || 0),
        title: item.title || item.productName || "Product",
        category: normalizeSubscriptionCategory(item.category || item.categoryName || item.Category?.name || ""),
        basePrice: Number(item.basePrice ?? item.price ?? 0),
        quantity: Number(item.quantity || 1),
        unit: item.unit || ""
      }))
    );
  }, [fallbackSubscriptionCandidate, state?.subscriptionCandidates]);

  const [selectedCandidateId, setSelectedCandidateId] = useState(
    () => String(subscriptionCandidates[0]?.productId || "")
  );

  const activeSubscriptionCandidate = useMemo(
    () =>
      subscriptionCandidates.find((item) => String(item.productId) === String(selectedCandidateId)) ||
      subscriptionCandidates[0] ||
      null,
    [selectedCandidateId, subscriptionCandidates]
  );

  const activeCategory = normalizeSubscriptionCategory(activeSubscriptionCandidate?.category || "");
  const isRationMode = grocerySubscriptionMode === SUBSCRIPTION_MODES.ration;

  const selectedUpsells = useMemo(
    () => upsellRecommendations.filter((item) => selectedUpsellIds.includes(item.id)),
    [selectedUpsellIds, upsellRecommendations]
  );

  const orderItemsTotal = useMemo(
    () =>
      cartItems.reduce((sum, item) => {
        const quantity = Number(item.quantity || item.qty || 1);
        const price = Number(item.price || item.basePrice || 0);
        return sum + quantity * price;
      }, 0),
    [cartItems]
  );

  const orderBaseAmount = Number(
    orderItemsTotal ||
      orderDetails?.cartTotal ||
      orderDetails?.totalAmount ||
      state?.orderDetails?.totalAmount ||
      activeSubscriptionCandidate?.basePrice ||
      0
  );

  const effectiveSubscriptionBasePrice = useMemo(() => {
    const base = Number(activeSubscriptionCandidate?.basePrice || 0);
    const upsellTotal = selectedUpsells.reduce((sum, item) => sum + Number(item.price || 0), 0);
    return Number((base + upsellTotal).toFixed(2));
  }, [activeSubscriptionCandidate?.basePrice, selectedUpsells]);

  const subscriptionPlans = useMemo(
    () => buildPaymentPlans(effectiveSubscriptionBasePrice, selectedRepeatFrequency),
    [effectiveSubscriptionBasePrice, selectedRepeatFrequency]
  );

  const groceryPlanTemplate = useMemo(
    () => GROCERY_PLANS.find((plan) => plan.value === selectedGroceryPlan) || GROCERY_PLANS[0],
    [selectedGroceryPlan]
  );

  const selectedGroceryPlanPreview = useMemo(
    () =>
      calculateSubscriptionPreview({
        category: "groceries",
        duration: selectedSubscriptionPeriod || "monthly",
        planType: selectedGroceryPlan,
        items: (groceryPlanTemplate?.items || []).map((item) => ({
          title: item.title,
          quantity: Number(item.quantity || 1),
          unitPrice: Number(item.unitPrice || 0),
          unit: item.unit || "",
          metadata: {
            source: "grocery_plan",
            key: item.key,
            title: item.title,
            unit: item.unit || ""
          }
        }))
      }),
    [groceryPlanTemplate, selectedGroceryPlan, selectedSubscriptionPeriod]
  );

  const groceryPlanItems = useMemo(
    () =>
      (groceryPlanTemplate?.items || []).map((item) => ({
        title: item.title,
        quantity: Number(item.quantity || 1),
        unitPrice: Number(item.unitPrice || 0),
        unit: item.unit || "",
        metadata: {
          source: "grocery_plan",
          key: item.key,
          title: item.title,
          unit: item.unit || ""
        }
      })),
    [groceryPlanTemplate]
  );

  const rationDurationPlans = useMemo(
    () =>
      PAYMENT_SUBSCRIPTION_PLANS.map((plan) => {
        const preview = calculateSubscriptionPreview({
          category: "groceries",
          duration: plan.period,
          planType: selectedGroceryPlan,
          items: groceryPlanItems
        });
        return {
          ...plan,
          discountedPrice: Number(preview.totalPayable || 0),
          savings: Number(preview.savings || 0)
        };
      }),
    [groceryPlanItems, selectedGroceryPlan]
  );

  const visibleSubscriptionPlans = isRationMode ? rationDurationPlans : subscriptionPlans;

  const selectedSubscriptionPlan = useMemo(
    () => visibleSubscriptionPlans.find((plan) => plan.period === selectedSubscriptionPeriod) || null,
    [selectedSubscriptionPeriod, visibleSubscriptionPlans]
  );

  const grocerySubscriptionPreview = useMemo(() => {
    if (!isRationMode || !selectedSubscriptionPeriod) {
      return null;
    }
    return calculateSubscriptionPreview({
      category: "groceries",
      duration: selectedSubscriptionPeriod,
      planType: selectedGroceryPlan,
      items: groceryPlanItems
    });
  }, [
    groceryPlanItems,
    isRationMode,
    selectedGroceryPlan,
    selectedSubscriptionPeriod
  ]);

  const effectiveSubscriptionSelection = useMemo(() => {
    if (subscriptionDraft?.pricing) {
      return {
        mode: "draft",
        amount: Number(subscriptionDraft.pricing.totalPayable || 0),
        label:
          `${subscriptionDraft.pricing.durationLabel || ""}` +
          `${subscriptionDraft.pricing.frequencyLabel ? ` | ${subscriptionDraft.pricing.frequencyLabel}` : ""}` +
          `${subscriptionDraft.pricing.planLabel ? ` | ${subscriptionDraft.pricing.planLabel}` : ""}`,
        items: subscriptionDraft.pricing.items || []
      };
    }

    if (!selectedSubscriptionPeriod) {
      return { mode: "none", amount: 0, label: "No subscription selected", items: [] };
    }

    if (grocerySubscriptionPreview) {
      return {
        mode: "ration",
        amount: Number(grocerySubscriptionPreview.totalPayable || 0),
        label: `${grocerySubscriptionPreview.durationLabel} | ${grocerySubscriptionPreview.planLabel}`,
        items: grocerySubscriptionPreview.items || []
      };
    }

    if (selectedSubscriptionPlan) {
      return {
        mode: "repeat",
        amount: Number(selectedSubscriptionPlan.discountedPrice || 0),
        label: `${selectedSubscriptionPlan.label} | ${getFrequencyConfig(selectedRepeatFrequency)?.label || "4 times/month"}${selectedUpsells.length ? ` | ${selectedUpsells.length} add-on${selectedUpsells.length === 1 ? "" : "s"}` : ""}`,
        items: [
          {
            title: activeSubscriptionCandidate?.title || "Product",
            quantity: Number(activeSubscriptionCandidate?.quantity || 1),
            lineTotal: Number(activeSubscriptionCandidate?.basePrice || 0)
          },
          ...selectedUpsells.map((item) => ({
            title: item.title,
            quantity: 1,
            lineTotal: Number(item.price || 0)
          }))
        ]
      };
    }

    return { mode: "none", amount: 0, label: "No subscription selected", items: [] };
  }, [
    activeSubscriptionCandidate?.basePrice,
    activeSubscriptionCandidate?.quantity,
    activeSubscriptionCandidate?.title,
    grocerySubscriptionPreview,
    selectedRepeatFrequency,
    selectedSubscriptionPeriod,
    selectedSubscriptionPlan,
    selectedUpsells,
    subscriptionDraft?.pricing
  ]);

  const paymentSummary = useMemo(() => {
    const subscriptionAmount = Number(effectiveSubscriptionSelection.amount || 0);
    return {
      orderAmount: Number(orderBaseAmount || 0),
      subscriptionAmount,
      payableNow: Number((Number(orderBaseAmount || 0) + subscriptionAmount).toFixed(2)),
      label: effectiveSubscriptionSelection.label,
      items: effectiveSubscriptionSelection.items || []
    };
  }, [effectiveSubscriptionSelection.amount, effectiveSubscriptionSelection.items, effectiveSubscriptionSelection.label, orderBaseAmount]);

  const hasSubscriptionAmount = Number(paymentSummary.subscriptionAmount || 0) > 0;

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
    if (!activeSubscriptionCandidate?.productId) return;
    setSelectedUpsellIds([]);
    setUpsellExpanded(false);
    setGrocerySubscriptionMode(SUBSCRIPTION_MODES.repeat_item);
    setSelectedRepeatFrequency("monthly_4");
  }, [activeSubscriptionCandidate?.productId]);

  useEffect(() => {
    if (!activeSubscriptionCandidate?.productId || subscriptionDraft?.id) {
      setUpsellRecommendations([]);
      return;
    }

    let mounted = true;
    api.get("/subscriptions/plans")
      .then((res) => {
        const plans = Array.isArray(res.data?.plans) ? res.data.plans : [];
        const cartProductIds = new Set(
          cartItems
            .map((item) => Number(item.id || item.productId || 0))
            .filter(Boolean)
        );
        const nextRows = plans
          .filter((item) => Number(item.id) !== Number(activeSubscriptionCandidate.productId))
          .filter((item) => !cartProductIds.has(Number(item.id)))
          .sort((left, right) => {
            const leftCategory = normalizeSubscriptionCategory(left.category?.name || left.category || "");
            const rightCategory = normalizeSubscriptionCategory(right.category?.name || right.category || "");
            const leftScore = leftCategory === activeCategory ? 1 : 0;
            const rightScore = rightCategory === activeCategory ? 1 : 0;
            return rightScore - leftScore;
          })
          .slice(0, 6);
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
  }, [activeCategory, activeSubscriptionCandidate?.productId, cartItems, subscriptionDraft?.id]);

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
    let draftId = subscriptionDraft?.id || null;
    if (!draftId && selectedSubscriptionPeriod && activeSubscriptionCandidate?.productId) {
      const createPayload =
        isRationMode
          ? {
              category: "groceries",
              primaryProductId: activeSubscriptionCandidate.productId,
              duration: selectedSubscriptionPeriod,
              planType: selectedGroceryPlan,
              source: "payment_ration",
              items: groceryPlanItems
            }
          : {
              category: activeCategory || "general",
              primaryProductId: activeSubscriptionCandidate.productId,
              duration: selectedSubscriptionPeriod,
              frequency: selectedRepeatFrequency,
              source: "payment_upsell",
              upsellAccepted: selectedUpsells.length > 0,
              recommendationIds: selectedUpsellIds,
              items: [
                {
                  productId: activeSubscriptionCandidate.productId,
                  quantity: Number(activeSubscriptionCandidate.quantity || 1),
                  unitPrice: Number(activeSubscriptionCandidate.basePrice || 0)
                },
                ...selectedUpsells.map((item) => ({
                  productId: item.id,
                  quantity: 1,
                  unitPrice: Number(item.price || 0)
                }))
              ]
            };

      const createRes = await api.post("/subscription/create", createPayload);
      draftId = createRes.data?.subscription?.id || null;
    }

    if (draftId) {
      form.append("subscriptionDraftId", String(draftId));
    }

    try {
      await api.post("/orders/submit-payment", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (draftId) {
        clearPendingSubscriptionDraft();
      } else if (!selectedSubscriptionPeriod && activeSubscriptionCandidate?.productId) {
        savePendingSubscriptionCandidate(activeSubscriptionCandidate);
      }

      navigate("/payment-success", {
        state: {
          orderId,
          txnId,
          screenshot: file ? URL.createObjectURL(file) : "",
          paymentMethod: method,
          orderDetails,
          subscriptionDraft,
          subscriptionCandidate: activeSubscriptionCandidate,
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
                {cartItems.length > 1
                  ? `${cartItems.length} items in this order`
                  : activeSubscriptionCandidate?.title || "Current order"}
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
                  : selectedSubscriptionPeriod
                    ? effectiveSubscriptionSelection.label
                    : "Not added"}
              </div>
            </div>
            <div style={{ fontWeight: 800, color: paymentSummary.subscriptionAmount > 0 ? "#9a3412" : "#6b7280" }}>
              {paymentSummary.subscriptionAmount > 0
                ? `Rs ${Number(paymentSummary.subscriptionAmount || 0).toFixed(2)}`
                : "—"}
            </div>
          </div>

          {(subscriptionDraft?.pricing?.items?.length || effectiveSubscriptionSelection.items?.length) ? (
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
                {!subscriptionDraft?.pricing?.items?.length && (effectiveSubscriptionSelection.items || []).map((item, index) => (
                  <div key={`selection-item-${index}`} style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 14, color: "#6b3f00" }}>
                    <span>{item.title || item.metadata?.title || `Item ${index + 1}`} x {Number(item.quantity || 1)}</span>
                    <span>Rs {Number(item.lineTotal || 0).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </details>
          ) : null}

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
          <div
            style={{
              marginTop: 12,
              marginBottom: 12,
              padding: "12px 14px",
              background: "#fffaf0",
              borderRadius: 12,
              border: "1px solid rgba(210, 140, 0, 0.18)"
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", color: "#9a3412" }}>
              Pay this amount
            </div>
            <div style={{ marginTop: 4, fontSize: 28, fontWeight: 900, color: "#C8102E" }}>
              Rs {Number(paymentSummary.payableNow || 0).toFixed(2)}
            </div>
            <div style={{ marginTop: 4, fontSize: 13, color: "#7c5200" }}>
              Order: Rs {Number(paymentSummary.orderAmount || 0).toFixed(2)}
              {hasSubscriptionAmount ? ` | Subscription: Rs ${Number(paymentSummary.subscriptionAmount || 0).toFixed(2)}` : ""}
            </div>
          </div>
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
          <div
            style={{
              marginTop: 12,
              marginBottom: 12,
              padding: "12px 14px",
              background: "#fffaf0",
              borderRadius: 12,
              border: "1px solid rgba(210, 140, 0, 0.18)"
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", color: "#9a3412" }}>
              Pay this amount
            </div>
            <div style={{ marginTop: 4, fontSize: 28, fontWeight: 900, color: "#C8102E" }}>
              Rs {Number(paymentSummary.payableNow || 0).toFixed(2)}
            </div>
            <div style={{ marginTop: 4, fontSize: 13, color: "#7c5200" }}>
              Order: Rs {Number(paymentSummary.orderAmount || 0).toFixed(2)}
              {hasSubscriptionAmount ? ` | Subscription: Rs ${Number(paymentSummary.subscriptionAmount || 0).toFixed(2)}` : ""}
            </div>
          </div>
          <div style={{ margin: "12px 0", display: "flex", justifyContent: "center" }}>
            <img src="/Pi network QR code.jpg" alt="Pi Network QR Code" style={{ width: 200, height: 200, borderRadius: 8, border: "1.5px solid #007bff", objectFit: "contain" }} />
          </div>
          <div style={{ fontSize: 14, color: "#555", textAlign: "center" }}>
            Scan the QR code above with Pi Network app to make payment. Then upload your payment screenshot and enter the Pi transaction ID below.
          </div>
        </div>
      )}

      <div
        className="payment-card"
        style={{
          background: "linear-gradient(135deg, #fff3b0 0%, #ffe082 100%)",
          padding: "18px 20px",
          borderRadius: "14px",
          marginBottom: "24px",
          border: "2px solid rgba(200, 16, 46, 0.15)",
          boxShadow: "0 8px 22px rgba(194, 120, 0, 0.12)"
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", color: "#9a3412" }}>
          Payable Now
        </div>
        <div
          style={{
            marginTop: 6,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
            flexWrap: "wrap"
          }}
        >
          <div>
            <div style={{ fontSize: 30, fontWeight: 900, color: "#C8102E", lineHeight: 1 }}>
              Rs {Number(paymentSummary.payableNow || 0).toFixed(2)}
            </div>
            <div style={{ marginTop: 6, fontSize: 13, color: "#6b3f00" }}>
              Products: Rs {Number(paymentSummary.orderAmount || 0).toFixed(2)}
              {hasSubscriptionAmount ? ` | Subscription: Rs ${Number(paymentSummary.subscriptionAmount || 0).toFixed(2)}` : ""}
            </div>
          </div>
          <div
            style={{
              padding: "8px 12px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.9)",
              color: "#5A3A00",
              fontWeight: 800
            }}
          >
            This is the amount to pay before upload
          </div>
        </div>
      </div>

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
                Pay Rs {Number(subscriptionDraft.pricing.totalPayable || 0).toFixed(2)} now
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
            Lock this into your payment now. We will remind you before every cycle and deliver on schedule, so you never have to reorder {activeSubscriptionCandidate?.title || "this product"} manually again.
          </p>
          <div
            style={{
              marginTop: 14,
              padding: "12px 14px",
              borderRadius: 12,
              background: "rgba(255,255,255,0.85)",
              border: "1px solid rgba(200, 16, 46, 0.16)"
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", color: "#9a3412" }}>
              Total payment with current selection
            </div>
            <div style={{ marginTop: 4, fontSize: 26, fontWeight: 900, color: "#C8102E" }}>
              Rs {Number(paymentSummary.payableNow || 0).toFixed(2)}
            </div>
            <div style={{ marginTop: 4, fontSize: 13, color: "#6b3f00" }}>
              Products: Rs {Number(paymentSummary.orderAmount || 0).toFixed(2)}
              {hasSubscriptionAmount ? ` | Subscription: Rs ${Number(paymentSummary.subscriptionAmount || 0).toFixed(2)}` : ""}
            </div>
          </div>

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
                ? `Included: ${effectiveSubscriptionSelection.label || "Plan"}`
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
                {!isRationMode && (
                  <>
                    <div style={{ fontWeight: 800, color: "#5A3A00", marginBottom: 8 }}>
                      Select monthly delivery count
                    </div>
                    <select
                      value={selectedRepeatFrequency}
                      onChange={(event) => setSelectedRepeatFrequency(event.target.value)}
                      style={{
                        width: "100%",
                        padding: "12px 14px",
                        borderRadius: 12,
                        border: "1px solid rgba(210, 140, 0, 0.2)",
                        fontWeight: 700,
                        marginBottom: 8
                      }}
                    >
                      {REPEAT_FREQUENCY_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <div style={{ marginBottom: 8, fontSize: 13, color: "#8b5e00" }}>
                      {REPEAT_FREQUENCY_OPTIONS.find((option) => option.value === selectedRepeatFrequency)?.hint || "Recurring delivery"}
                    </div>
                  </>
                )}
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
                  {visibleSubscriptionPlans.map((plan) => (
                    <option key={plan.period} value={plan.period}>
                      {plan.label} | Rs {plan.discountedPrice.toFixed(2)}
                    </option>
                  ))}
                </select>
                {selectedSubscriptionPeriod && (
                  <div style={{ marginTop: 8, fontSize: 13, color: "#8b5e00" }}>
                    {visibleSubscriptionPlans.find((plan) => plan.period === selectedSubscriptionPeriod)?.badge || "Value plan"} | Recurring delivery stays handled after approval.
                  </div>
                )}
              </div>

              {selectedSubscriptionPeriod && (
                <div
                  style={{
                    background: "rgba(255,255,255,0.78)",
                    borderRadius: 14,
                    padding: "14px 16px",
                    border: "1px solid rgba(210, 140, 0, 0.16)"
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 800, textTransform: "uppercase", color: "#9a3412", marginBottom: 8 }}>
                    Subscription Type
                  </div>
                  <div style={{ fontWeight: 800, color: "#5A3A00", marginBottom: 10 }}>
                    Choose how you want to continue
                  </div>
                  <div style={{ display: "grid", gap: 10 }}>
                    {[
                      {
                        value: SUBSCRIPTION_MODES.repeat_item,
                        title: "Repeat current item",
                        description: `Keep ${activeSubscriptionCandidate?.title || "this product"} on recurring delivery`
                      },
                      {
                        value: SUBSCRIPTION_MODES.ration,
                        title: "Monthly ration",
                        description: "Choose one of four household ration packages"
                      }
                    ].map((option) => {
                      const active = grocerySubscriptionMode === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setGrocerySubscriptionMode(option.value)}
                          style={{
                            textAlign: "left",
                            borderRadius: 12,
                            border: active ? "1px solid #C8102E" : "1px solid #eee",
                            background: active ? "#fff7d6" : "#fff",
                            padding: "12px 14px",
                            cursor: "pointer"
                          }}
                        >
                          <div style={{ fontWeight: 800, color: "#5A3A00" }}>{option.title}</div>
                          <div style={{ marginTop: 4, fontSize: 13, color: "#8b5e00" }}>{option.description}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

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
                      {isRationMode ? (
                        <div style={{ fontSize: 13, color: "#8b5e00" }}>
                          These add-ons are shown here for reference. They are applied when you use the repeat-item subscription.
                        </div>
                      ) : null}
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
                              cursor: isRationMode ? "default" : "pointer",
                              opacity: isRationMode ? 0.72 : 1
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
                              disabled={isRationMode}
                              onChange={() => toggleUpsell(item.id)}
                            />
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {selectedSubscriptionPeriod && isRationMode && (
                <div
                  style={{
                    background: "rgba(255,255,255,0.78)",
                    borderRadius: 14,
                    padding: "14px 16px",
                    border: "1px solid rgba(210, 140, 0, 0.16)"
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 800, textTransform: "uppercase", color: "#9a3412", marginBottom: 8 }}>
                    Step 3
                  </div>
                  <div style={{ fontWeight: 800, color: "#5A3A00", marginBottom: 10 }}>
                    Select monthly ration package
                  </div>
                  <select
                    value={selectedGroceryPlan}
                    onChange={(event) => setSelectedGroceryPlan(event.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      borderRadius: 12,
                      border: "1px solid rgba(210, 140, 0, 0.2)",
                      fontWeight: 700
                    }}
                  >
                    {GROCERY_PLANS.map((plan) => {
                      const preview = calculateSubscriptionPreview({
                        category: "groceries",
                        duration: selectedSubscriptionPeriod,
                        planType: plan.value,
                        items: plan.items.map((item) => ({
                          title: item.title,
                          quantity: Number(item.quantity || 1),
                          unitPrice: Number(item.unitPrice || 0),
                          unit: item.unit || "",
                          metadata: {
                            source: "grocery_plan",
                            key: item.key,
                            title: item.title,
                            unit: item.unit || ""
                          }
                        }))
                      });
                      return (
                        <option key={plan.value} value={plan.value}>
                          {plan.label} | Rs {Number(preview.totalPayable || 0).toFixed(2)}
                        </option>
                      );
                    })}
                  </select>
                  <div
                    style={{
                      marginTop: 12,
                      borderRadius: 12,
                      border: "1px solid #C8102E",
                      background: "#fff7d6",
                      padding: "12px 14px"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                      <div>
                        <div style={{ fontWeight: 800, color: "#5A3A00" }}>{groceryPlanTemplate.label}</div>
                        <div style={{ marginTop: 4, fontSize: 13, color: "#8b5e00" }}>{groceryPlanTemplate.badge}</div>
                      </div>
                      <div style={{ fontWeight: 800, color: "#9a3412" }}>
                        Rs {Number(selectedGroceryPlanPreview.totalPayable || 0).toFixed(2)}
                      </div>
                    </div>
                    <div style={{ marginTop: 8, fontSize: 13, color: "#6b3f00" }}>
                      {groceryPlanTemplate.items.map((item) => `${item.title} ${item.quantity}${item.unit ? ` ${item.unit}` : ""}`).join(" | ")}
                    </div>
                  </div>
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
              Included subscription amount: Rs {Number(effectiveSubscriptionSelection.amount || 0).toFixed(2)}
              {!isRationMode ? ` | ${getFrequencyConfig(selectedRepeatFrequency)?.label || "4 times/month"}` : ""}
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
        <div
          style={{
            marginBottom: 14,
            padding: "12px 14px",
            borderRadius: 12,
            background: "#fffaf0",
            border: "1px solid rgba(210, 140, 0, 0.18)"
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", color: "#9a3412" }}>
            Amount you should have paid
          </div>
          <div style={{ marginTop: 4, fontSize: 28, fontWeight: 900, color: "#C8102E" }}>
            Rs {Number(paymentSummary.payableNow || 0).toFixed(2)}
          </div>
          <div style={{ marginTop: 4, fontSize: 13, color: "#6b3f00" }}>
            {hasSubscriptionAmount
              ? `Includes order and subscription`
              : `Order payment only`}
          </div>
        </div>

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
        <div
          style={{
            marginBottom: 14,
            padding: "12px 14px",
            borderRadius: 12,
            background: "#fffaf0",
            border: "1px solid rgba(210, 140, 0, 0.18)"
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", color: "#9a3412" }}>
            Final amount to verify
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginTop: 6 }}>
            <div style={{ color: "#6b3f00", fontSize: 14 }}>
              Upload screenshot and enter the transaction ID for this exact amount.
            </div>
            <div style={{ fontSize: 24, fontWeight: 900, color: "#C8102E", whiteSpace: "nowrap" }}>
              Rs {Number(paymentSummary.payableNow || 0).toFixed(2)}
            </div>
          </div>
        </div>
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
