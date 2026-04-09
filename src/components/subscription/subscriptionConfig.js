export const SUBSCRIPTION_DURATIONS = [
  { value: "monthly", label: "Monthly", months: 1, discountPercent: 5 },
  { value: "quarterly", label: "3 Months", months: 3, discountPercent: 7, badge: "Best Balance" },
  { value: "half_yearly", label: "6 Months", months: 6, discountPercent: 9 },
  { value: "yearly", label: "12 Months", months: 12, discountPercent: 12, badge: "Best Value" }
];

export const SUBSCRIPTION_FREQUENCIES = [
  { value: "monthly_4", label: "4 times/month", occurrencesPerMonth: 4 },
  { value: "monthly_15", label: "15 times/month", occurrencesPerMonth: 15 },
  { value: "monthly_30", label: "30 times/month", occurrencesPerMonth: 30 },
  { value: "twice_weekly", label: "2 times/week", occurrencesPerMonth: 8, multiplier: 2 / 7 },
  { value: "thrice_weekly", label: "3 times/week", occurrencesPerMonth: 12, multiplier: 3 / 7 },
  { value: "daily", label: "Daily", occurrencesPerMonth: 30, multiplier: 1 }
];

export const GROCERY_PLANS = [
  {
    value: "basic",
    label: "Basic",
    badge: "Daily Basics",
    items: [
      { key: "rice", title: "Rice", quantity: 5, unit: "kg", unitPrice: 65 },
      { key: "atta", title: "Atta", quantity: 3, unit: "kg", unitPrice: 52 },
      { key: "oil", title: "Oil", quantity: 1, unit: "ltr", unitPrice: 160 },
      { key: "pulses", title: "Pulses", quantity: 2, unit: "kg", unitPrice: 110 },
      { key: "essentials", title: "Home Essentials", quantity: 1, unit: "pack", unitPrice: 120 }
    ]
  },
  {
    value: "standard",
    label: "Standard",
    badge: "Balanced Home",
    items: [
      { key: "rice", title: "Rice", quantity: 10, unit: "kg", unitPrice: 65 },
      { key: "atta", title: "Atta", quantity: 5, unit: "kg", unitPrice: 52 },
      { key: "oil", title: "Oil", quantity: 2, unit: "ltr", unitPrice: 160 },
      { key: "pulses", title: "Pulses", quantity: 3, unit: "kg", unitPrice: 110 },
      { key: "essentials", title: "Home Essentials", quantity: 2, unit: "pack", unitPrice: 120 }
    ]
  },
  {
    value: "advanced",
    label: "Advanced",
    badge: "Most Popular",
    items: [
      { key: "rice", title: "Rice", quantity: 15, unit: "kg", unitPrice: 65 },
      { key: "atta", title: "Atta", quantity: 7, unit: "kg", unitPrice: 52 },
      { key: "oil", title: "Oil", quantity: 3, unit: "ltr", unitPrice: 160 },
      { key: "pulses", title: "Pulses", quantity: 4, unit: "kg", unitPrice: 110 },
      { key: "essentials", title: "Home Essentials", quantity: 3, unit: "pack", unitPrice: 120 }
    ]
  },
  {
    value: "premium",
    label: "Premium",
    badge: "All Home Needs",
    items: [
      { key: "rice", title: "Rice", quantity: 20, unit: "kg", unitPrice: 65 },
      { key: "atta", title: "Atta", quantity: 10, unit: "kg", unitPrice: 52 },
      { key: "oil", title: "Oil", quantity: 4, unit: "ltr", unitPrice: 160 },
      { key: "pulses", title: "Pulses", quantity: 6, unit: "kg", unitPrice: 110 },
      { key: "essentials", title: "Home Essentials", quantity: 4, unit: "pack", unitPrice: 120 }
    ]
  }
];

export function normalizeSubscriptionCategory(input) {
  const raw = String(input?.name || input || "").trim().toLowerCase();
  if (raw.includes("flower")) return "flowers";
  if (raw.includes("grocery") || raw.includes("pickle")) return "groceries";
  if (raw.includes("pet")) return "pet_services";
  return raw || "general";
}

export function needsFrequency(category) {
  return ["flowers", "pet_services"].includes(normalizeSubscriptionCategory(category));
}

export function getDurationConfig(duration) {
  return SUBSCRIPTION_DURATIONS.find((item) => item.value === duration) || SUBSCRIPTION_DURATIONS[0];
}

export function getFrequencyConfig(frequency) {
  return SUBSCRIPTION_FREQUENCIES.find((item) => item.value === frequency) || null;
}

export function getGroceryPlan(planType) {
  const normalized = String(planType || "").trim().toLowerCase();
  const aliases = {
    pro: "advanced",
    vip: "premium"
  };
  const resolved = aliases[normalized] || normalized;
  return GROCERY_PLANS.find((item) => item.value === resolved) || GROCERY_PLANS[0];
}

export function calculateSubscriptionPreview({ category, duration, frequency, planType, items }) {
  const normalizedCategory = normalizeSubscriptionCategory(category);
  const durationConfig = getDurationConfig(duration);
  const frequencyConfig = getFrequencyConfig(frequency);
  const plan = getGroceryPlan(planType);

  const normalizedItems = (Array.isArray(items) ? items : []).map((item) => {
    const quantity = Number(item.quantity || 1);
    const unitPrice = Number(item.unitPrice ?? item.price ?? 0);
    return {
      ...item,
      quantity,
      unitPrice,
      lineTotal: Number((quantity * unitPrice).toFixed(2))
    };
  });

  const baseSubtotal = normalizedItems.reduce((sum, item) => sum + item.lineTotal, 0);

  let cycleMultiplier = 1;
  if (frequencyConfig?.occurrencesPerMonth) {
    cycleMultiplier = frequencyConfig.occurrencesPerMonth;
  } else if (needsFrequency(normalizedCategory) && frequencyConfig) {
    cycleMultiplier = (frequencyConfig.multiplier || 1) * 7;
  }
  const cycleSubtotal = Number((baseSubtotal * cycleMultiplier).toFixed(2));
  const durationBasePrice = Number((cycleSubtotal * durationConfig.months).toFixed(2));
  const discountedPrice = Number((durationBasePrice * (1 - durationConfig.discountPercent / 100)).toFixed(2));

  return {
    category: normalizedCategory,
    duration: durationConfig.value,
    durationLabel: durationConfig.label,
    frequency: frequencyConfig?.value || null,
    frequencyLabel: frequencyConfig?.label || null,
    planType: plan?.value || null,
    planLabel: plan?.label || null,
    itemCount: normalizedItems.length,
    cycleSubtotal,
    durationBasePrice,
    totalPayable: discountedPrice,
    savings: Number((durationBasePrice - discountedPrice).toFixed(2)),
    discountPercent: durationConfig.discountPercent,
    items: normalizedItems
  };
}
