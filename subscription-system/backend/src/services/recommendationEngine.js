// Simple rule-based recommendation engine

async function recommend(input) {
  // input: category, cart (array), user_id
  const category = input.category || '';
  const cart = input.cart ? JSON.parse(input.cart) : (input.cart || []);

  const recs = [];

  if (['flowers','fruits','vegetables'].includes(category)) {
    // suggest bundles
    recs.push({
      id: 'weekly-basket',
      title: 'Weekly Basket',
      description: 'Curated weekly selection to keep freshness for the week',
      savings: '10%'
    });
    recs.push({
      id: 'family-pack',
      title: 'Family Pack',
      description: 'Bigger quantities for families, save more',
      savings: '15%'
    });
    // suggest upsell based on cart
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

module.exports = { recommend };
