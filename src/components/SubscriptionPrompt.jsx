import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import { clearPendingSubscriptionDraft } from "./SubscriptionWidget";

const PLAN_LABELS = {
  monthly: "Monthly",
  quarterly: "3 Months",
  half_yearly: "6 Months",
  yearly: "Yearly"
};

function buildPlans(basePrice) {
  const normalizedPrice = Number(basePrice || 0);
  if (normalizedPrice <= 0) return [];

  return [
    { period: "monthly", label: "Monthly", discountPercent: 5, months: 1 },
    { period: "quarterly", label: "3 Months", discountPercent: 7, months: 3 },
    { period: "half_yearly", label: "6 Months", discountPercent: 9, months: 6 },
    { period: "yearly", label: "Yearly", discountPercent: 12, months: 12 }
  ].map((plan) => {
    const baseCyclePrice = normalizedPrice * plan.months;
    const discountedPrice = Number((baseCyclePrice * (1 - plan.discountPercent / 100)).toFixed(2));
    return {
      ...plan,
      discountedPrice,
      savings: Number((baseCyclePrice - discountedPrice).toFixed(2))
    };
  });
}

function readStoredCandidate() {
  try {
    const raw = localStorage.getItem("pendingSubscriptionCandidate");
    return raw ? JSON.parse(raw) : null;
  } catch (_err) {
    return null;
  }
}

function writeStoredCandidate(candidate) {
  if (!candidate) {
    localStorage.removeItem("pendingSubscriptionCandidate");
    return;
  }
  localStorage.setItem("pendingSubscriptionCandidate", JSON.stringify(candidate));
}

export function savePendingSubscriptionCandidate(candidate) {
  if (!candidate || !candidate.productId) return;
  writeStoredCandidate({
    ...candidate,
    savedAt: new Date().toISOString()
  });
}

export function clearPendingSubscriptionCandidate() {
  writeStoredCandidate(null);
}

export default function SubscriptionPrompt({ initialCandidate = null, compact = false }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [candidate, setCandidate] = useState(initialCandidate || null);
  const [plans, setPlans] = useState([]);
  const [subscribeError, setSubscribeError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const stored = readStoredCandidate();
    const nextCandidate = initialCandidate || stored || null;
    setCandidate(nextCandidate);
    setPlans(buildPlans(nextCandidate?.basePrice));
  }, [initialCandidate]);

  if (!candidate || plans.length === 0 || dismissed) {
    return null;
  }

  const closePrompt = () => {
    setDismissed(true);
  };

  const subscribeNow = async (period) => {
    if (!user) {
      navigate("/login");
      return;
    }

    setSubscribeError("");
    setSubmitting(true);
    try {
      const [addressRes, createRes] = await Promise.all([
        api.get("/customer/address"),
        api.post("/subscriptions/create", {
          category: candidate.category || "general",
          primaryProductId: candidate.productId,
          duration: period,
          source: "subscription_prompt",
          items: [
            {
              productId: candidate.productId,
              quantity: Number(candidate.quantity || 1),
              unitPrice: Number(candidate.basePrice || 0)
            }
          ]
        })
      ]);
      const addresses = Array.isArray(addressRes.data) ? addressRes.data : [];
      const defaultAddress = addresses.find((item) => item.isDefault) || addresses[0] || null;
      if (!defaultAddress) {
        throw new Error("Please save a delivery address before starting a subscription.");
      }

      const orderRes = await api.post("/orders/create", {
        productId: candidate.productId,
        qty: Number(candidate.quantity || 1),
        subscriptionDraftId: createRes.data?.subscription?.id,
        addressId: defaultAddress.id,
        customerName: defaultAddress.name || "",
        customerPhone: defaultAddress.phone || "",
        customerAddress: [
          defaultAddress.addressLine,
          defaultAddress.city,
          defaultAddress.state,
          defaultAddress.pincode ? `- ${defaultAddress.pincode}` : ""
        ].filter(Boolean).join(", "),
        promoCode: null,
        discount: 0
      });

      clearPendingSubscriptionCandidate();
      clearPendingSubscriptionDraft();
      setDismissed(true);
      navigate("/payment", {
        state: {
          orderId: orderRes.data.orderId,
          orderDetails: orderRes.data,
          subscriptionDraft: {
            id: createRes.data?.subscription?.id,
            pricing: createRes.data?.pricing,
            items: createRes.data?.items || [],
            productId: candidate.productId
          }
        }
      });
    } catch (err) {
      setSubscribeError(err.response?.data?.error || err.message || "Failed to subscribe");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        marginBottom: compact ? 16 : 24,
        padding: compact ? 16 : 22,
        borderRadius: 20,
        background: "linear-gradient(135deg, #fff8cc 0%, #ffe78a 52%, #ffd55c 100%)",
        color: "#5A3A00",
        boxShadow: "0 14px 40px rgba(194, 120, 0, 0.16)",
        border: "1px solid rgba(210, 140, 0, 0.2)"
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "start" }}>
        <div style={{ maxWidth: 760 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 12px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.7)",
              fontSize: 12,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: 0.4,
              color: "#9a3412"
            }}
          >
            Smart Repeat Delivery
          </div>
          <div style={{ marginTop: 10, fontSize: compact ? 24 : 30, fontWeight: 900, lineHeight: 1.05 }}>
            Subscribe and Forget
          </div>
          <div style={{ marginTop: 8, fontSize: compact ? 15 : 17, fontWeight: 700 }}>
            We remind, we schedule, and we deliver {candidate.title || "your product"} on time.
          </div>
          <div style={{ marginTop: 8, fontSize: 14, color: "#6b3f00", lineHeight: 1.6 }}>
            No last-minute reordering. No missed essentials. Just steady savings and one less thing to think about.
          </div>
        </div>
        <button
          onClick={closePrompt}
          style={{
            border: "none",
            background: "transparent",
            cursor: "pointer",
            fontSize: 18,
            lineHeight: 1,
            color: "#5A3A00"
          }}
          aria-label="Dismiss subscription prompt"
        >
          x
        </button>
      </div>

      <div
        style={{
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          marginTop: 14,
          marginBottom: 14
        }}
      >
        {[
          "Recurring delivery",
          "We remind you before dispatch",
          "Pause or renew later",
          "Extra subscription savings"
        ].map((point) => (
          <div
            key={point}
            style={{
              padding: "8px 12px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.72)",
              fontSize: 13,
              fontWeight: 700,
              color: "#6b3f00"
            }}
          >
            {point}
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
        {plans.map((plan) => (
          <div
            key={plan.period}
            style={{
              background: "rgba(255,255,255,0.82)",
              borderRadius: 16,
              padding: compact ? 12 : 14,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
              border: "1px solid rgba(210, 140, 0, 0.14)"
            }}
          >
            <div style={{ minWidth: 220 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <div style={{ fontWeight: 800, fontSize: 18 }}>
                  {plan.label} plan
                </div>
                <div
                  style={{
                    padding: "4px 10px",
                    borderRadius: 999,
                    background: "#fff1f2",
                    color: "#be123c",
                    fontWeight: 800,
                    fontSize: 12
                  }}
                >
                  Save {plan.discountPercent}%
                </div>
              </div>
              <div style={{ fontSize: 14, marginTop: 6, color: "#6b3f00" }}>
                Pay Rs {plan.discountedPrice.toFixed(2)} for {plan.months} month{plan.months > 1 ? "s" : ""} and save Rs {plan.savings.toFixed(2)}
              </div>
              <div style={{ fontSize: 13, marginTop: 4, color: "#8b5e00" }}>
                Best for customers who want zero reorder stress.
              </div>
            </div>
            <button
              onClick={() => subscribeNow(plan.period)}
              disabled={submitting}
              style={{
                padding: compact ? "10px 14px" : "12px 18px",
                background: "linear-gradient(135deg, #C8102E 0%, #9f1239 100%)",
                color: "white",
                border: "none",
                borderRadius: 12,
                cursor: submitting ? "not-allowed" : "pointer",
                fontWeight: 800,
                boxShadow: "0 8px 20px rgba(159, 18, 57, 0.2)"
              }}
            >
              {submitting ? "Processing..." : `Subscribe ${PLAN_LABELS[plan.period]}`}
            </button>
          </div>
        ))}
      </div>

      {subscribeError && (
        <div style={{ marginTop: 8, color: "#C8102E", fontSize: 13 }}>{subscribeError}</div>
      )}
    </div>
  );
}
