import dayjs from 'dayjs';
import { getCategoryRules } from './subscriptionDb.js';

const GROCERY_BUNDLES = {
  'basic': [{ id: 'rice-5kg', qty: 1, price: 300 }, { id: 'atta-3kg', qty: 1, price: 150 }],
  'advanced': [{ id: 'rice-7kg', qty: 1, price: 420 }, { id: 'atta-5kg', qty: 1, price: 250 }, { id: 'oil-1l', qty: 1, price: 180 }],
  'pro': [{ id: 'rice-10kg', qty: 1, price: 600 }, { id: 'atta-5kg', qty: 2, price: 500 }, { id: 'oil-1l', qty: 2, price: 360 }, { id: 'pulses-1kg', qty: 2, price: 240 }],
  'vip': [{ id: 'organic-rice-10kg', qty: 1, price: 900 }, { id: 'atta-10kg', qty: 1, price: 480 }, { id: 'cold-pressed-oil-5l', qty: 1, price: 1200 }, { id: 'premium-pulses-pack', qty: 1, price: 500 }]
};

export async function calculatePricing(payload) {
  const { category, plan_name, items = [] } = payload;
  let base = 0;

  // Handle Grocery Bundles
  if (category === 'groceries' && plan_name && GROCERY_BUNDLES[plan_name.toLowerCase()]) {
    const bundle = GROCERY_BUNDLES[plan_name.toLowerCase()];
    bundle.forEach(it => base += (it.price * it.qty));
  } else {
    items.forEach(it => base += (it.price || 50) * (it.quantity || 1));
  }

  const defaultFreqMap = { 'Starter':1, 'Smart':2, 'Value+':3, 'Daily+':7, 'Essential':14, 'Family':14, 'Plus':14, 'Premium':14 };

  let frequency = payload.frequency || 1;
  let discount = 0;

  try {
    const dynamicRules = await getCategoryRules(category);
    if (dynamicRules) {
      if (dynamicRules.plans && dynamicRules.plans[plan_name] !== undefined) {
        const val = dynamicRules.plans[plan_name];
        if (typeof val === 'number') frequency = val;
      }
      if (dynamicRules.discounts && dynamicRules.discounts[plan_name] !== undefined) {
        discount = Number(dynamicRules.discounts[plan_name]) || 0;
      }
    }
  } catch (e) {
    console.warn('Failed to load dynamic rules for', category, e?.message || e);
  }

  if (discount === 0) {
    if (['flowers', 'fruits', 'vegetables'].includes(category)) {
      const freqDiscounts = { 1: 0.05, 2: 0.10, 3: 0.15, 7: 0.25 };
      discount = freqDiscounts[frequency] || 0;
    } else if (category === 'groceries') {
      discount = 0.12; 
    } else if (category === 'services' || category === 'pet services') {
      const serviceDiscounts = { 'monthly': 0.05, 'quarterly': 0.15, 'yearly': 0.30 };
      discount = serviceDiscounts[plan_name?.toLowerCase()] || 0;
    }
  }

  if (!frequency || frequency === 1) {
    frequency = defaultFreqMap[plan_name] || payload.frequency || 1;
  }

  if (items.length > 1) discount += 0.02;

  const finalPrice = +(base * (1 - discount)).toFixed(2);

  return { 
    basePrice: base, 
    finalPrice, 
    discountApplied: (Math.round(discount * 100)) + '%',
    frequency,
    priceBefore: base,
    priceAfter: finalPrice
  };
}

export function computeNextDelivery(payload) {
  let result = payload.next_delivery_date;

  if (!result) {
    const now = dayjs();
    if (payload.delivery_days && payload.delivery_days.length) {
      for (let i = 0; i < 14; i++) {
        const candidate = now.add(i, 'day');
        if (payload.delivery_days.includes(candidate.day())) {
          result = candidate.toISOString();
          break;
        }
      }
    }
    if (!result) {
      result = now.add(payload.frequency || 1, 'week').toISOString();
    }
  }

  return result;
}

/**
 * Generates personalized recommendations based on cart content.
 * Handles multi-category detection and duplicate prevention.
 * Provides metadata for compact grid layouts and grouping.
 */
export async function recommend(input) {
  let cart = [];
  try {
    cart = input.cart ? (typeof input.cart === 'string' ? JSON.parse(input.cart) : input.cart) : [];
  } catch (e) {
    console.error('Failed to parse cart for recommendations:', e);
    cart = [];
  }
  
  const cartItemIds = new Set(cart.map(item => String(item.id || item.productId || '')));
  const cartCategories = [...new Set(cart.map(item => item.category).filter(Boolean))];
  const categoriesToProcess = new Set(cartCategories);
  if (input.category) categoriesToProcess.add(input.category);

  const allRecs = [];

  for (const cat of categoriesToProcess) {
    const categoryRecs = [];
    if (['flowers', 'fruits', 'vegetables'].includes(cat)) {
      categoryRecs.push({ 
        id: `weekly-basket-${cat}`, 
        category: cat, 
        title: `${cat.charAt(0).toUpperCase() + cat.slice(1)} Weekly Basket`, 
        description: 'Curated weekly selection for freshness', 
        savings: '10%'
      });
      categoryRecs.push({ 
        id: `family-pack-${cat}`, 
        category: cat, 
        title: 'Family Pack', 
        description: 'Bigger quantities for families', 
        savings: '15%'
      });
      
      const catCount = cart.filter(it => it.category === cat).reduce((s, c) => s + (c.qty || 1), 0);
      if (catCount > 0 && catCount < 3) {
        categoryRecs.push({ id: `add-more-${cat}`, category: cat, title: `Add more ${cat}`, savings: '5%' });
      }
    } else if (cat === 'groceries') {
      categoryRecs.push({ id: 'essential-bundle', category: cat, title: 'Essential Bundle', description: 'Rice, Atta, Oil, Pulses', savings: '8%' });
    } else if (cat === 'pet services') {
      categoryRecs.push({ id: 'time-plan', category: cat, title: 'Flexible Time Plans', description: 'Monthly / Quarterly booking plans' });
    }
  }

  if (!cartCategories.includes('groceries')) {
    allRecs.push({
      id: 'grocery-plan-upsell',
      category: 'groceries',
      title: 'Monthly Grocery Plan',
      description: 'Add a Monthly Grocery Plan & Save More',
      savings: 'Up to 15%',
      type: 'checkout_modal_trigger'
    });
  }

  const seen = new Set();
  return allRecs
    .filter(item => {
      const idStr = String(item.id);
      const shouldKeep = !seen.has(idStr) && !cartItemIds.has(idStr);
      seen.add(idStr);
      return shouldKeep;
    })
    .sort((a, b) => {
      if (a.category === 'groceries' && b.category !== 'groceries') return 1;
      if (a.category !== 'groceries' && b.category === 'groceries') return -1;
      return 0;
    });
}
