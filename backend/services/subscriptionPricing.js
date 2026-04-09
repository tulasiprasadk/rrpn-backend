import {
  categoryRequiresFrequency,
  getDurationConfig,
  getFrequencyConfig,
  getGroceryPlan,
  normalizeSubscriptionCategory
} from "./subscriptionConfig.js";

function roundCurrency(value) {
  return Number(Number(value || 0).toFixed(2));
}

export function validateSubscriptionPayload(payload = {}) {
  const category = normalizeSubscriptionCategory(payload.category);
  const duration = payload.duration || payload.period;
  const durationConfig = getDurationConfig(duration);
  if (!durationConfig) {
    return { ok: false, error: "Invalid duration" };
  }

  if (categoryRequiresFrequency(category)) {
    const frequencyConfig = getFrequencyConfig(payload.frequency);
    if (!frequencyConfig) {
      return { ok: false, error: "Frequency is required for this category" };
    }
  }

  if (category === "groceries") {
    const plan = getGroceryPlan(payload.planType);
    if (!plan) {
      return { ok: false, error: "Invalid grocery plan" };
    }
  }

  if (!Array.isArray(payload.items) || payload.items.length === 0) {
    return { ok: false, error: "At least one subscription item is required" };
  }

  return { ok: true };
}

export function buildSubscriptionPricing(payload = {}) {
  const category = normalizeSubscriptionCategory(payload.category);
  const durationConfig = getDurationConfig(payload.duration || payload.period);
  const frequencyConfig = getFrequencyConfig(payload.frequency);
  const plan = getGroceryPlan(payload.planType);

  const items = Array.isArray(payload.items) ? payload.items : [];
  const normalizedItems = items.map((item) => {
    const quantity = Number(item.quantity || 1);
    const unitPrice = Number(item.unitPrice ?? item.price ?? 0);
    return {
      ...item,
      productId: item.productId ? Number(item.productId) : null,
      quantity,
      unitPrice,
      lineTotal: roundCurrency(quantity * unitPrice)
    };
  });

  const baseSubtotal = normalizedItems.reduce((sum, item) => sum + item.lineTotal, 0);

  let frequencyMultiplier = 1;
  if (frequencyConfig?.occurrencesPerMonth) {
    frequencyMultiplier = roundCurrency(frequencyConfig.occurrencesPerMonth);
  } else if (categoryRequiresFrequency(category) && frequencyConfig) {
    frequencyMultiplier = roundCurrency(frequencyConfig.multiplier * 7);
  }

  const cycleSubtotal = roundCurrency(baseSubtotal * frequencyMultiplier);
  const durationBasePrice = roundCurrency(cycleSubtotal * durationConfig.months);
  const discountedPrice = roundCurrency(durationBasePrice * (1 - durationConfig.discountPercent / 100));
  const savings = roundCurrency(durationBasePrice - discountedPrice);

  return {
    category,
    duration: durationConfig.value,
    durationLabel: durationConfig.label,
    months: durationConfig.months,
    frequency: frequencyConfig?.value || null,
    frequencyLabel: frequencyConfig?.label || null,
    planType: plan?.value || null,
    planLabel: plan?.label || null,
    itemCount: normalizedItems.length,
    cycleSubtotal,
    durationBasePrice,
    discountPercent: durationConfig.discountPercent,
    totalPayable: discountedPrice,
    savings,
    items: normalizedItems
  };
}
