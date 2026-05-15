const DURATIONS = [
  { value: "monthly", label: "Monthly", months: 1, discountPercent: 5 },
  { value: "quarterly", label: "3 Months", months: 3, discountPercent: 7 },
  { value: "half_yearly", label: "6 Months", months: 6, discountPercent: 9 },
  { value: "yearly", label: "12 Months", months: 12, discountPercent: 12 },
];

const FREQUENCIES = [
  { value: "monthly_4", label: "4 times/month", occurrencesPerMonth: 4 },
  { value: "monthly_15", label: "15 times/month", occurrencesPerMonth: 15 },
  { value: "monthly_30", label: "30 times/month", occurrencesPerMonth: 30 },
  { value: "twice_weekly", label: "2 times/week", occurrencesPerMonth: 8 },
  { value: "thrice_weekly", label: "3 times/week", occurrencesPerMonth: 12 },
  { value: "daily", label: "Daily", occurrencesPerMonth: 30 },
];

export function calculateSubscriptionPreview({ category, duration, frequency, planType, items }) {
  const durationConfig = DURATIONS.find((item) => item.value === duration) || DURATIONS[0];
  const frequencyConfig = FREQUENCIES.find((item) => item.value === frequency) || null;
  const normalizedItems = (Array.isArray(items) ? items : []).map((item) => {
    const quantity = Number(item.quantity || 1);
    const unitPrice = Number(item.unitPrice ?? item.price ?? 0);
    return {
      ...item,
      quantity,
      unitPrice,
      lineTotal: Number((quantity * unitPrice).toFixed(2)),
    };
  });

  const baseSubtotal = normalizedItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const cycleMultiplier = frequencyConfig?.occurrencesPerMonth || 1;
  const cycleSubtotal = Number((baseSubtotal * cycleMultiplier).toFixed(2));
  const durationBasePrice = Number((cycleSubtotal * durationConfig.months).toFixed(2));
  const totalPayable = Number((durationBasePrice * (1 - durationConfig.discountPercent / 100)).toFixed(2));

  return {
    category,
    duration: durationConfig.value,
    durationLabel: durationConfig.label,
    frequency: frequencyConfig?.value || null,
    frequencyLabel: frequencyConfig?.label || null,
    planType: planType || null,
    planLabel: planType ? titleCase(planType) : null,
    itemCount: normalizedItems.length,
    cycleSubtotal,
    durationBasePrice,
    totalPayable,
    savings: Number((durationBasePrice - totalPayable).toFixed(2)),
    discountPercent: durationConfig.discountPercent,
    items: normalizedItems,
  };
}

export async function readJsonBody(req) {
  if (req.body && Buffer.isBuffer(req.body)) {
    const raw = req.body.toString("utf8");
    return raw ? JSON.parse(raw) : {};
  }

  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") return JSON.parse(req.body || "{}");

  if (typeof req.on !== "function") return {};

  const raw = await new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
  return raw ? JSON.parse(raw) : {};
}

function titleCase(value) {
  return String(value || "")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
