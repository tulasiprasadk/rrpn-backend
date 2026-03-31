const dayjs = require('dayjs');

function calculate(payload) {
  // payload includes category, plan_type, items, quantities
  const { category, plan_type, items = [], quantities = {} } = payload;
  // simple rule-based pricing per category
  let base = 0;
  items.forEach(it => {
    const qty = quantities[it.id] || it.qty || 1;
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

module.exports = { calculate };
