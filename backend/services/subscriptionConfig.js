export const SUBSCRIPTION_DURATIONS = [
  { value: "monthly", label: "Monthly", months: 1, discountPercent: 5 },
  { value: "quarterly", label: "3 Months", months: 3, discountPercent: 7 },
  { value: "half_yearly", label: "6 Months", months: 6, discountPercent: 9 },
  { value: "yearly", label: "12 Months", months: 12, discountPercent: 12 }
];

export const SUBSCRIPTION_FREQUENCIES = [
  { value: "monthly_4", label: "4 times/month", occurrencesPerMonth: 4 },
  { value: "monthly_15", label: "15 times/month", occurrencesPerMonth: 15 },
  { value: "monthly_30", label: "30 times/month", occurrencesPerMonth: 30 },
  { value: "twice_weekly", label: "2 times/week", occurrencesPerMonth: 8, multiplier: 2 / 7 },
  { value: "thrice_weekly", label: "3 times/week", occurrencesPerMonth: 12, multiplier: 3 / 7 },
  { value: "daily", label: "Daily", occurrencesPerMonth: 30, multiplier: 1 }
];

export const GROCERY_PLAN_TEMPLATES = [
  {
    value: "basic",
    label: "Basic",
    badge: "Daily Basics",
    items: [
      { key: "rice", title: "Rice", quantity: 5, unit: "kg" },
      { key: "atta", title: "Atta", quantity: 3, unit: "kg" },
      { key: "oil", title: "Oil", quantity: 1, unit: "ltr" },
      { key: "pulses", title: "Pulses", quantity: 2, unit: "kg" },
      { key: "sugar", title: "Sugar", quantity: 2, unit: "kg" },
      { key: "salt", title: "Salt", quantity: 1, unit: "kg" },
      { key: "turmeric", title: "Turmeric Powder", quantity: 1, unit: "pack" },
      { key: "chilli", title: "Chilly Powder", quantity: 1, unit: "pack" },
      { key: "tea", title: "Tea Powder", quantity: 1, unit: "pack" },
      { key: "soap", title: "Bath Soap", quantity: 3, unit: "pcs" },
      { key: "detergent", title: "Detergent Powder", quantity: 1, unit: "kg" }
    ]
  },
  {
    value: "standard",
    label: "Standard",
    badge: "Balanced Home",
    items: [
      { key: "rice", title: "Rice", quantity: 10, unit: "kg" },
      { key: "atta", title: "Atta", quantity: 5, unit: "kg" },
      { key: "oil", title: "Oil", quantity: 2, unit: "ltr" },
      { key: "pulses", title: "Pulses", quantity: 3, unit: "kg" },
      { key: "sugar", title: "Sugar", quantity: 3, unit: "kg" },
      { key: "salt", title: "Salt", quantity: 2, unit: "kg" },
      { key: "turmeric", title: "Turmeric Powder", quantity: 2, unit: "pack" },
      { key: "chilli", title: "Chilly Powder", quantity: 2, unit: "pack" },
      { key: "coriander", title: "Coriander Powder", quantity: 1, unit: "pack" },
      { key: "tea", title: "Tea Powder", quantity: 1, unit: "pack" },
      { key: "coffee", title: "Coffee Powder", quantity: 1, unit: "pack" },
      { key: "onion", title: "Onion", quantity: 2, unit: "kg" },
      { key: "potato", title: "Potato", quantity: 2, unit: "kg" },
      { key: "soap", title: "Bath Soap", quantity: 4, unit: "pcs" },
      { key: "toothpaste", title: "Tooth Paste", quantity: 2, unit: "pcs" },
      { key: "detergent", title: "Detergent Powder", quantity: 2, unit: "kg" }
    ]
  },
  {
    value: "advanced",
    label: "Advanced",
    badge: "Most Popular",
    items: [
      { key: "rice", title: "Rice", quantity: 15, unit: "kg" },
      { key: "atta", title: "Atta", quantity: 7, unit: "kg" },
      { key: "oil", title: "Oil", quantity: 3, unit: "ltr" },
      { key: "pulses", title: "Pulses", quantity: 4, unit: "kg" },
      { key: "sugar", title: "Sugar", quantity: 4, unit: "kg" },
      { key: "salt", title: "Salt", quantity: 2, unit: "kg" },
      { key: "turmeric", title: "Turmeric Powder", quantity: 2, unit: "pack" },
      { key: "chilli", title: "Chilly Powder", quantity: 2, unit: "pack" },
      { key: "coriander", title: "Coriander Powder", quantity: 2, unit: "pack" },
      { key: "tea", title: "Tea Powder", quantity: 2, unit: "pack" },
      { key: "coffee", title: "Coffee Powder", quantity: 1, unit: "pack" },
      { key: "onion", title: "Onion", quantity: 3, unit: "kg" },
      { key: "potato", title: "Potato", quantity: 3, unit: "kg" },
      { key: "garlic", title: "Garlic", quantity: 1, unit: "kg" },
      { key: "soap", title: "Bath Soap", quantity: 6, unit: "pcs" },
      { key: "toothpaste", title: "Tooth Paste", quantity: 2, unit: "pcs" },
      { key: "washing", title: "Washing Soap", quantity: 4, unit: "pcs" },
      { key: "detergent", title: "Detergent Powder", quantity: 2, unit: "kg" }
    ]
  },
  {
    value: "premium",
    label: "Premium",
    badge: "All Home Needs",
    items: [
      { key: "rice", title: "Rice", quantity: 20, unit: "kg" },
      { key: "atta", title: "Atta", quantity: 10, unit: "kg" },
      { key: "oil", title: "Oil", quantity: 4, unit: "ltr" },
      { key: "pulses", title: "Pulses", quantity: 6, unit: "kg" },
      { key: "sugar", title: "Sugar", quantity: 5, unit: "kg" },
      { key: "salt", title: "Salt", quantity: 3, unit: "kg" },
      { key: "turmeric", title: "Turmeric Powder", quantity: 3, unit: "pack" },
      { key: "chilli", title: "Chilly Powder", quantity: 3, unit: "pack" },
      { key: "coriander", title: "Coriander Powder", quantity: 2, unit: "pack" },
      { key: "tea", title: "Tea Powder", quantity: 2, unit: "pack" },
      { key: "coffee", title: "Coffee Powder", quantity: 2, unit: "pack" },
      { key: "onion", title: "Onion", quantity: 4, unit: "kg" },
      { key: "potato", title: "Potato", quantity: 4, unit: "kg" },
      { key: "garlic", title: "Garlic", quantity: 2, unit: "kg" },
      { key: "soap", title: "Bath Soap", quantity: 8, unit: "pcs" },
      { key: "toothpaste", title: "Tooth Paste", quantity: 3, unit: "pcs" },
      { key: "washing", title: "Washing Soap", quantity: 6, unit: "pcs" },
      { key: "detergent", title: "Detergent Powder", quantity: 3, unit: "kg" },
      { key: "toilet-cleaner", title: "Toilet Cleaner", quantity: 2, unit: "btl" }
    ]
  }
];

const FLOWER_NAMES = ["flower", "flowers"];
const GROCERY_NAMES = ["grocery", "groceries", "pickles"];
const PET_SERVICE_NAMES = ["pet services", "pet service", "pet"];

export function normalizeSubscriptionCategory(input) {
  const raw = String(input || "").trim().toLowerCase();
  if (FLOWER_NAMES.some((name) => raw.includes(name))) return "flowers";
  if (GROCERY_NAMES.some((name) => raw.includes(name))) return "groceries";
  if (PET_SERVICE_NAMES.some((name) => raw.includes(name))) return "pet_services";
  return raw || "general";
}

export function getDurationConfig(duration) {
  return SUBSCRIPTION_DURATIONS.find((item) => item.value === duration) || null;
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
  return GROCERY_PLAN_TEMPLATES.find((item) => item.value === resolved) || null;
}

export function categoryRequiresFrequency(category) {
  return ["flowers", "pet_services"].includes(normalizeSubscriptionCategory(category));
}
