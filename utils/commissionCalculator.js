/**
 * Commission Calculator
 * Calculates platform commission and fees
 */

import { models } from "../config/database.js";

let configCache = null;
let configCacheTime = 0;
const CACHE_DURATION = 60000; // 1 minute

async function getPlatformConfig() {
  const now = Date.now();
  if (configCache && (now - configCacheTime) < CACHE_DURATION) {
    return configCache;
  }

  try {
    const { PlatformConfig } = models;
    const configs = await PlatformConfig.findAll();
    const configMap = {};
    configs.forEach(config => {
      let value = config.value;
      if (config.type === 'number') {
        value = parseFloat(value);
      } else if (config.type === 'boolean') {
        value = value === 'true';
      } else if (config.type === 'json') {
        try {
          value = JSON.parse(value);
        } catch {
          value = value;
        }
      }
      configMap[config.key] = value;
    });
    configCache = configMap;
    configCacheTime = now;
    return configMap;
  } catch (err) {
    console.error('Error loading platform config:', err);
    return {};
  }
}

/**
 * Calculate platform commission
 * @param {number} amount - Base amount
 * @param {number} commissionRate - Commission rate (optional, will fetch from config if not provided)
 * @returns {number} Commission amount
 */
export async function calculateCommission(amount, commissionRate = null) {
  if (commissionRate === null) {
    const config = await getPlatformConfig();
    commissionRate = config.platform_commission || parseFloat(process.env.PLATFORM_COMMISSION || 15);
  }
  return (amount * commissionRate) / 100;
}

/**
 * Calculate total order amount with fees
 * @param {number} baseAmount - Base product/service amount
 * @param {object} options - Additional options
 * @returns {object} Breakdown of amounts
 */
export async function calculateOrderTotal(baseAmount, options = {}) {
  const config = await getPlatformConfig();
  
  // Import delivery calculator dynamically to avoid circular dependency
  const { calculateDeliveryCharge } = await import('./deliveryCalculator.js');
  
  const {
    platformFee = config.platform_fee || parseFloat(process.env.PLATFORM_FEE || 0),
    commissionRate = config.platform_commission || parseFloat(process.env.PLATFORM_COMMISSION || 15),
    minOrderAmount = config.min_order_amount || parseFloat(process.env.MIN_ORDER_AMOUNT || 0),
    distance = 0,
    weight = 0,
    zone = null
  } = options;
  
  // Calculate delivery charge using the delivery calculator
  const deliveryFee = await calculateDeliveryCharge({
    distance,
    weight,
    zone,
    orderValue: baseAmount
  });

  // Apply minimum order amount check
  if (baseAmount < minOrderAmount) {
    const additionalFee = minOrderAmount - baseAmount;
    platformFee += additionalFee;
  }

  const commission = await calculateCommission(baseAmount, commissionRate);
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
 * Get platform configuration (synchronous version for compatibility)
 */
export function getPlatformConfigSync() {
  return {
    commissionRate: parseFloat(process.env.PLATFORM_COMMISSION || 15),
    platformFee: parseFloat(process.env.PLATFORM_FEE || 0),
    deliveryFee: parseFloat(process.env.DELIVERY_FEE || 0),
    minOrderAmount: parseFloat(process.env.MIN_ORDER_AMOUNT || 0)
  };
}
