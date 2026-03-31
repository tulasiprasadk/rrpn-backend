import dayjs from 'dayjs';

export function calculatePricing(payload) {
  const { category, plan_type, items = [], quantities = {} } = payload;
  let base = 0;
  items.forEach(it => {
    const qty = (quantities && quantities[it.id]) || it.qty || 1;
    base += (it.price || 10) * qty;
  });

  const discountMap = {
    'flowers': { 'Starter': 0.05, 'Smart': 0.1, 'Value+': 0.15, 'Daily+': 0.2 },
    'fruits': { 'Starter': 0.05, 'Smart': 0.08, 'Value+': 0.12, 'Daily+': 0.18 },
    'vegetables': { 'Starter': 0.05, 'Smart': 0.09, 'Value+': 0.14, 'Daily+': 0.19 },
    'groceries': { 'Essential': 0.04, 'Family': 0.08, 'Plus': 0.12, 'Premium': 0.06 }
  };

  const freqMap = { 'Starter':1, 'Smart':2, 'Value+':3, 'Daily+':7, 'Essential':14, 'Family':14, 'Plus':14, 'Premium':14 };

  const discount = (discountMap[category] && discountMap[category][plan_type]) || 0;
  const priceBefore = base;
  const priceAfter = +(base * (1 - discount)).toFixed(2);

  return { priceBefore, priceAfter, discount, frequency: freqMap[plan_type] || payload.frequency || 1 };
}

export function computeNextDelivery(payload) {
  const now = dayjs();
  if (payload.next_delivery_date) return payload.next_delivery_date;
  if (payload.delivery_days && payload.delivery_days.length) {
    const days = payload.delivery_days;
    for (let i=0;i<14;i++){
      const candidate = now.add(i, 'day');
      const wd = candidate.day();
      if (days.includes(wd)) return candidate.toISOString();
    }
  }
  const freq = payload.frequency || 1;
  return now.add(freq, 'week').toISOString();
}

export async function recommend(input) {
  const category = input.category || '';
  const cart = input.cart ? JSON.parse(input.cart) : (input.cart || []);
  const recs = [];

  if (['flowers','fruits','vegetables'].includes(category)) {
    recs.push({ id: 'weekly-basket', title: 'Weekly Basket', description: 'Curated weekly selection to keep freshness for the week', savings: '10%' });
    recs.push({ id: 'family-pack', title: 'Family Pack', description: 'Bigger quantities for families, save more', savings: '15%' });
    if (cart.length && cart.reduce((s,c)=>s+(c.qty||1),0) < 3) {
      recs.push({ id: 'add-more', title: 'Add more for better value', savings: '5%' });
    }
  } else if (category === 'groceries') {
    recs.push({ id: 'essential-bundle', title: 'Essential Bundle', description: 'Rice, Atta, Oil, Pulses', savings: '8%' });
  } else if (['consultancy','pet services','local services'].includes(category)) {
    recs.push({ id: 'time-plan', title: 'Flexible Time Plans', description: 'Monthly / Quarterly booking plans' });
  }

  return recs;
}
