/**
 * Delivery Charges Calculator
 * Supports multiple delivery charge models: flat, distance-based, weight-based, zone-based
 */

import { models } from "../config/database.js";
import { Op } from 'sequelize';

let configCache = null;
let configCacheTime = 0;
const CACHE_DURATION = 60000; // 1 minute

async function getDeliveryConfig() {
  const now = Date.now();
  if (configCache && (now - configCacheTime) < CACHE_DURATION) {
    return configCache;
  }

  try {
    const { PlatformConfig } = models;
    const configs = await PlatformConfig.findAll({
      where: {
        key: {
          [Op.like]: 'delivery_%'
        }
      }
    });
    
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
    console.error('Error loading delivery config:', err);
    return {};
  }
}

/**
 * Calculate delivery charges
 * @param {object} options - Delivery options
 * @param {number} options.distance - Distance in km (optional)
 * @param {number} options.weight - Weight in kg (optional)
 * @param {string} options.zone - Delivery zone (optional)
 * @param {number} options.orderValue - Order value in ₹ (optional)
 * @returns {number} Delivery charge
 */
export async function calculateDeliveryCharge(options = {}) {
  const config = await getDeliveryConfig();
  
  const {
    distance = 0,
    weight = 0,
    zone = null,
    orderValue = 0
  } = options;

  // Get delivery model type
  const modelType = config.delivery_model || 'flat';
  
  let charge = 0;

  switch (modelType) {
    case 'flat':
      // Simple flat rate
      charge = config.delivery_fee || parseFloat(process.env.DELIVERY_FEE || 0);
      break;

    case 'distance':
      // Distance-based: base fee + (distance * per_km_rate)
      const baseFee = config.delivery_base_fee || 0;
      const perKmRate = config.delivery_per_km || 0;
      charge = baseFee + (distance * perKmRate);
      
      // Apply minimum and maximum
      const minCharge = config.delivery_min_charge || 0;
      const maxCharge = config.delivery_max_charge || null;
      charge = Math.max(charge, minCharge);
      if (maxCharge !== null) {
        charge = Math.min(charge, maxCharge);
      }
      break;

    case 'weight':
      // Weight-based: base fee + (weight * per_kg_rate)
      const weightBaseFee = config.delivery_base_fee || 0;
      const perKgRate = config.delivery_per_kg || 0;
      charge = weightBaseFee + (weight * perKgRate);
      
      const weightMinCharge = config.delivery_min_charge || 0;
      const weightMaxCharge = config.delivery_max_charge || null;
      charge = Math.max(charge, weightMinCharge);
      if (weightMaxCharge !== null) {
        charge = Math.min(charge, weightMaxCharge);
      }
      break;

    case 'zone':
      // Zone-based: different rates for different zones
      if (zone && config.delivery_zones) {
        try {
          const zones = typeof config.delivery_zones === 'string' 
            ? JSON.parse(config.delivery_zones) 
            : config.delivery_zones;
          
          const zoneConfig = zones.find(z => z.name === zone || z.id === zone);
          if (zoneConfig) {
            charge = zoneConfig.charge || 0;
          } else {
            charge = config.delivery_fee || 0; // Default
          }
        } catch {
          charge = config.delivery_fee || 0;
        }
      } else {
        charge = config.delivery_fee || 0;
      }
      break;

    case 'combined':
      // Combined: distance + weight
      const combinedBaseFee = config.delivery_base_fee || 0;
      const combinedPerKm = config.delivery_per_km || 0;
      const combinedPerKg = config.delivery_per_kg || 0;
      charge = combinedBaseFee + (distance * combinedPerKm) + (weight * combinedPerKg);
      
      const combinedMinCharge = config.delivery_min_charge || 0;
      const combinedMaxCharge = config.delivery_max_charge || null;
      charge = Math.max(charge, combinedMinCharge);
      if (combinedMaxCharge !== null) {
        charge = Math.min(charge, combinedMaxCharge);
      }
      break;

    case 'free_threshold':
      // Free delivery above order value threshold
      const threshold = config.delivery_free_threshold || 0;
      if (orderValue >= threshold) {
        charge = 0;
      } else {
        charge = config.delivery_fee || 0;
      }
      break;

    default:
      charge = config.delivery_fee || parseFloat(process.env.DELIVERY_FEE || 0);
  }

  return Math.round(charge * 100) / 100; // Round to 2 decimal places
}

/**
 * Get delivery configuration
 */
export async function getDeliveryConfigSync() {
  return await getDeliveryConfig();
}
