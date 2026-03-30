export const SUBSCRIPTION_PLANS = {
  monthly: { label: "Monthly", months: 1, discountPercent: 5 },
  quarterly: { label: "3 Months", months: 3, discountPercent: 7 },
  half_yearly: { label: "6 Months", months: 6, discountPercent: 9 },
  yearly: { label: "Yearly", months: 12, discountPercent: 12 }
};

export function buildPlanForBasePrice(basePrice, period) {
  const config = SUBSCRIPTION_PLANS[period];
  const normalizedPrice = Number(basePrice || 0);
  if (!config || normalizedPrice <= 0) {
    return null;
  }

  const baseCyclePrice = normalizedPrice * config.months;
  const discountedPrice = Number((baseCyclePrice * (1 - config.discountPercent / 100)).toFixed(2));
  const savings = Number((baseCyclePrice - discountedPrice).toFixed(2));

  return {
    period,
    label: config.label,
    months: config.months,
    discountPercent: config.discountPercent,
    baseCyclePrice: Number(baseCyclePrice.toFixed(2)),
    discountedPrice,
    savings
  };
}

export function buildPlanForProduct(product, period) {
  return buildPlanForBasePrice(product?.price || 0, period);
}
