/**
 * Commission Calculator
 * Calculates platform commission and fees
 */

/**
 * Calculate platform commission
 * @param {number} amount - Base amount
 * @param {number} commissionRate - Commission rate (default 15%)
 * @returns {number} Commission amount
 */
export function calculateCommission(amount, commissionRate = null) {
  const rate = commissionRate || parseFloat(process.env.PLATFORM_COMMISSION || 15);
  return (amount * rate) / 100;
}

/**
 * Calculate total order amount with fees
 * @param {number} baseAmount - Base product/service amount
 * @param {object} options - Additional options
 * @returns {object} Breakdown of amounts
 */
export function calculateOrderTotal(baseAmount, options = {}) {
  const {
    platformFee = parseFloat(process.env.PLATFORM_FEE || 0),
    deliveryFee = parseFloat(process.env.DELIVERY_FEE || 0),
    commissionRate = parseFloat(process.env.PLATFORM_COMMISSION || 15),
    minOrderAmount = parseFloat(process.env.MIN_ORDER_AMOUNT || 0)
  } = options;

  // Apply minimum order amount check
  if (baseAmount < minOrderAmount) {
    const additionalFee = minOrderAmount - baseAmount;
    platformFee += additionalFee;
  }

  const commission = calculateCommission(baseAmount, commissionRate);
  const supplierAmount = baseAmount - commission;
  const totalAmount = baseAmount + platformFee + deliveryFee;

  return {
    baseAmount,
    platformFee,
    deliveryFee,
    commission,
    supplierAmount,
    totalAmount
  };
}

/**
 * Get platform configuration
 */
export function getPlatformConfig() {
  return {
    commissionRate: parseFloat(process.env.PLATFORM_COMMISSION || 15),
    platformFee: parseFloat(process.env.PLATFORM_FEE || 0),
    deliveryFee: parseFloat(process.env.DELIVERY_FEE || 0),
    minOrderAmount: parseFloat(process.env.MIN_ORDER_AMOUNT || 0)
  };
}
