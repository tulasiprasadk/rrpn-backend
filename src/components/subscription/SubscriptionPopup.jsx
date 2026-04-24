import { useEffect, useMemo, useState } from "react";
import api from "../../api/client";
import DurationDropdown from "./DurationDropdown";
import FrequencyDropdown from "./FrequencyDropdown";
import GroceryPlanSelector from "./GroceryPlanSelector";
import UpsellMultiSelect from "./UpsellMultiSelect";
import {
  calculateSubscriptionPreview,
  GROCERY_PLANS,
  normalizeSubscriptionCategory,
  needsFrequency,
  SUBSCRIPTION_DURATIONS,
  SUBSCRIPTION_FREQUENCIES
} from "./subscriptionConfig";
import "./SubscriptionPopup.css";

function parseMetadata(value) {
  if (!value) return {};
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch (_err) {
    return {};
  }
}

function buildBaseItem(product, quantity = 1) {
  return {
    productId: product.id,
    title: product.title || product.name || "Subscription item",
    quantity: Number(quantity || 1),
    unitPrice: Number(product.price || product.basePrice || 0),
    unit: product.unit || ""
  };
}

function buildRationItems(product) {
  const metadata = parseMetadata(product?.metadata);
  const rows = Array.isArray(metadata?.items) ? metadata.items : [];
  return rows.map((item) => ({
    title: item.title,
    quantity: Number(item.quantity || 1),
    unitPrice: Number(item.unitPrice || 0),
    unit: item.unit || "",
    metadata: {
      source: "ration_plan",
      key: item.key,
      title: item.title,
      section: item.section || "",
      unit: item.unit || ""
    }
  }));
}

function HighlightChip({ children }) {
  return (
    <span
      style={{
        background: "#fff",
        border: "1px solid #f2d060",
        color: "#7a2034",
        borderRadius: 999,
        padding: "7px 12px",
        fontSize: 13,
        fontWeight: 700
      }}
    >
      {children}
    </span>
  );
}

export default function SubscriptionPopup({ open, onClose, product, quantity = 1, onConfirmed }) {
  const category = normalizeSubscriptionCategory(product?.category || product?.Category?.name || "");
  const isRation = category === "ration";
  const productMetadata = useMemo(() => parseMetadata(product?.metadata), [product?.metadata]);
  const [enabled, setEnabled] = useState(true);
  const [frequency, setFrequency] = useState(SUBSCRIPTION_FREQUENCIES[0].value);
  const [duration, setDuration] = useState(SUBSCRIPTION_DURATIONS[0].value);
  const [planType, setPlanType] = useState(GROCERY_PLANS[0].value);
  const [planExpanded, setPlanExpanded] = useState(false);
  const [groceryItems, setGroceryItems] = useState(GROCERY_PLANS[0].items);
  const [recommendations, setRecommendations] = useState([]);
  const [selectedUpsell, setSelectedUpsell] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !product) return;

    setEnabled(true);
    setDuration(SUBSCRIPTION_DURATIONS[0].value);
    setFrequency(SUBSCRIPTION_FREQUENCIES[0].value);
    setPlanType(GROCERY_PLANS[0].value);
    setGroceryItems(GROCERY_PLANS[0].items);
    setSelectedUpsell([]);
    setPlanExpanded(false);
    setError("");

    if (["flowers", "pet_services"].includes(category)) {
      api
        .get("/subscriptions/plans")
        .then((res) => {
          const rows = Array.isArray(res.data?.plans)
            ? res.data.plans
            : Array.isArray(res.data?.monthly)
              ? res.data.monthly
              : [];
          const sameCategory = rows
            .filter((item) => normalizeSubscriptionCategory(item.category?.name || item.category || "") === category)
            .filter((item) => Number(item.id) !== Number(product.id))
            .slice(0, 3);
          setRecommendations(sameCategory);
        })
        .catch(() => setRecommendations([]));
      return;
    }

    setRecommendations([]);
  }, [open, product, category]);

  const selectedPlan = useMemo(
    () => GROCERY_PLANS.find((plan) => plan.value === planType) || GROCERY_PLANS[0],
    [planType]
  );

  const rationHighlights = Array.isArray(productMetadata?.highlights) ? productMetadata.highlights : [];
  const rationPreviewItems = useMemo(
    () => (Array.isArray(productMetadata?.items) ? productMetadata.items.slice(0, 8) : []),
    [productMetadata]
  );

  const draftItems = useMemo(() => {
    if (!product) return [];

    if (isRation) {
      return buildRationItems(product);
    }

    if (category === "groceries") {
      return groceryItems.map((item) => ({
        title: item.title,
        quantity: Number(item.quantity || 1),
        unitPrice: Number(item.unitPrice || 0),
        unit: item.unit,
        metadata: { source: "grocery_plan", key: item.key, title: item.title, unit: item.unit }
      }));
    }

    const upsellItems = recommendations
      .filter((item) => selectedUpsell.includes(item.id))
      .map((item) => ({
        productId: item.id,
        title: item.title,
        quantity: 1,
        unitPrice: Number(item.price || 0),
        unit: item.unit || ""
      }));

    return [buildBaseItem(product, quantity), ...upsellItems];
  }, [category, groceryItems, isRation, product, quantity, recommendations, selectedUpsell]);

  const pricing = useMemo(
    () =>
      calculateSubscriptionPreview({
        category,
        duration,
        frequency,
        planType,
        items: draftItems
      }),
    [category, duration, frequency, planType, draftItems]
  );

  const toggleUpsell = (item) => {
    setSelectedUpsell((current) =>
      current.includes(item.id) ? current.filter((id) => id !== item.id) : [...current, item.id]
    );
  };

  const handlePlanChange = (nextPlanType) => {
    const nextPlan = GROCERY_PLANS.find((plan) => plan.value === nextPlanType) || GROCERY_PLANS[0];
    setPlanType(nextPlanType);
    setGroceryItems(nextPlan.items);
  };

  const handleGroceryQtyChange = (key, nextValue) => {
    const quantityValue = Math.max(1, Number(nextValue || 1));
    setGroceryItems((current) =>
      current.map((item) => (item.key === key ? { ...item, quantity: quantityValue } : item))
    );
  };

  const handleConfirm = async () => {
    if (!enabled) {
      onClose();
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const payload = {
        category,
        primaryProductId: product.id,
        duration,
        frequency: needsFrequency(category) ? frequency : null,
        planType: category === "groceries" ? planType : null,
        source: isRation ? "ration_popup" : "product_popup",
        upsellAccepted: selectedUpsell.length > 0,
        recommendationIds: selectedUpsell,
        items: draftItems
      };
      const res = await api.post("/subscriptions/create", payload);
      onConfirmed?.({
        draft: res.data?.subscription,
        items: res.data?.items || [],
        pricing: res.data?.pricing || pricing
      });
      onClose();
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Failed to prepare subscription");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open || !product) return null;

  return (
    <div className="subscription-popup__backdrop" onClick={onClose}>
      <div className="subscription-popup__modal" onClick={(event) => event.stopPropagation()}>
        <div className="subscription-popup__header">
          <div>
            <div className="subscription-popup__eyebrow">
              {isRation ? "Featured Monthly Ration" : category === "groceries" ? "Subscribe Monthly Ration" : "Subscribe & Save More"}
            </div>
            <div className="subscription-popup__title">
              {isRation ? product.title || "Choose your ration basket" : "Subscribe & Save More"}
            </div>
            <div className="subscription-popup__subtitle">
              {isRation
                ? "Pick a duration, review what is included, and continue with one clear bundled monthly basket."
                : "Keep this flow guided: switch it on, choose the cycle, optionally add related items, and carry everything into payment in one go."}
            </div>
          </div>
          <button type="button" className="subscription-popup__close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="subscription-popup__steps">
          <div className="subscription-popup__card subscription-popup__toggle-row">
            <label className="subscription-popup__toggle">
              <input type="checkbox" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} />
              Enable subscription for this item
            </label>
            <div className="subscription-popup__section-subtitle">
              We will save the setup now and attach it to payment approval later.
            </div>
          </div>

          {enabled && (
            <>
              <div className="subscription-popup__card">
                <div className="subscription-popup__section-title">
                  {isRation ? "Step 1. Choose your subscription duration" : "Step 1. Choose your cycle"}
                </div>
                <div className="subscription-popup__selectors">
                  {needsFrequency(category) && (
                    <FrequencyDropdown
                      value={frequency}
                      options={SUBSCRIPTION_FREQUENCIES}
                      onChange={setFrequency}
                    />
                  )}
                  <DurationDropdown
                    value={duration}
                    options={SUBSCRIPTION_DURATIONS}
                    onChange={setDuration}
                  />
                </div>
              </div>

              {isRation ? (
                <div className="subscription-popup__card">
                  <div
                    style={{
                      display: "grid",
                      gap: 14,
                      background: "linear-gradient(135deg, #fff7d6 0%, #fff2b0 100%)",
                      border: "1px solid #f2d060",
                      borderRadius: 16,
                      padding: 16
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "start", flexWrap: "wrap" }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 0.6, color: "#8b5e00", textTransform: "uppercase" }}>
                          Highlighted Ration Basket
                        </div>
                        <div style={{ fontSize: 22, fontWeight: 900, color: "#5a3a00", marginTop: 4 }}>
                          {product.title}
                        </div>
                        <div style={{ fontSize: 14, color: "#6b4b00", marginTop: 6 }}>
                          {product.description}
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 12, color: "#8b5e00", fontWeight: 800 }}>
                          {productMetadata?.badge || "Ration Plan"}
                        </div>
                        <div style={{ fontSize: 28, fontWeight: 900, color: "#C8102E", marginTop: 4 }}>
                          Rs {Number(product.price || 0).toFixed(2)}
                        </div>
                        <div style={{ fontSize: 13, color: "#6b4b00" }}>
                          {Number(productMetadata?.itemCount || rationPreviewItems.length)} items included
                        </div>
                      </div>
                    </div>

                    {rationHighlights.length > 0 && (
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {rationHighlights.map((item) => (
                          <HighlightChip key={item}>{item}</HighlightChip>
                        ))}
                      </div>
                    )}

                    {rationPreviewItems.length > 0 && (
                      <div>
                        <div className="subscription-popup__section-title" style={{ marginBottom: 10 }}>
                          Included in this basket
                        </div>
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                            gap: 10
                          }}
                        >
                          {rationPreviewItems.map((item) => (
                            <div
                              key={item.key}
                              style={{
                                background: "#fff",
                                borderRadius: 12,
                                padding: 12,
                                border: "1px solid #f5deb0"
                              }}
                            >
                              <div style={{ fontWeight: 800, color: "#5a3a00" }}>{item.title}</div>
                              <div style={{ fontSize: 13, color: "#7a5a00", marginTop: 4 }}>{item.unit}</div>
                              <div style={{ fontSize: 12, color: "#9a6f00", marginTop: 4 }}>{item.section}</div>
                            </div>
                          ))}
                        </div>
                        {Number(productMetadata?.itemCount || 0) > rationPreviewItems.length && (
                          <div style={{ marginTop: 10, fontSize: 13, color: "#7a5a00", fontWeight: 700 }}>
                            Plus {Number(productMetadata?.itemCount || 0) - rationPreviewItems.length} more items in the full ration basket
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : category === "groceries" ? (
                <GroceryPlanSelector
                  value={planType}
                  plans={GROCERY_PLANS}
                  onChange={handlePlanChange}
                  expanded={planExpanded}
                  onToggleExpanded={() => setPlanExpanded((current) => !current)}
                  selectedPlan={selectedPlan}
                  onQuantityChange={handleGroceryQtyChange}
                />
              ) : (
                <UpsellMultiSelect
                  title={category === "pet_services" ? "Add more services" : "Add more flowers to your subscription"}
                  subtitle="Choose only a few related items. We keep the list short so the popup stays easy to scan."
                  items={recommendations}
                  selectedIds={selectedUpsell}
                  onToggle={toggleUpsell}
                />
              )}
            </>
          )}
        </div>

        <div className="subscription-popup__summary">
          <div className="subscription-popup__eyebrow">Live pricing</div>
          <div className="subscription-popup__price">Rs {Number(pricing.totalPayable || 0).toFixed(2)}</div>
          <div className="subscription-popup__meta">
            Save Rs {Number(pricing.savings || 0).toFixed(2)} across {pricing.durationLabel}
            {pricing.frequencyLabel ? ` | ${pricing.frequencyLabel}` : ""}
            {pricing.planLabel ? ` | ${pricing.planLabel}` : ""}
          </div>
          <div className="subscription-popup__meta">
            {pricing.itemCount} item{pricing.itemCount === 1 ? "" : "s"} included
          </div>
        </div>

        <div className="subscription-popup__footer">
          <div className="subscription-popup__error">{error}</div>
          <div className="subscription-popup__actions">
            <button
              type="button"
              className="subscription-popup__button subscription-popup__button--secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="button"
              className="subscription-popup__button subscription-popup__button--primary"
              onClick={handleConfirm}
              disabled={submitting}
            >
              {submitting ? "Preparing..." : "Confirm & Continue"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
