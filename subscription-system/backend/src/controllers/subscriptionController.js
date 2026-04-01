const db = require('../db');
const pricing = require('../services/pricingEngine');
const scheduler = require('../services/scheduler');
const recommender = require('../services/recommendationEngine');
const { v4: uuidv4 } = require('uuid');

async function create(req, res) {
  try {
    const payload = req.body;
    // validate required fields
    if (!payload.user_id || !payload.category || !payload.plan_type || !payload.items) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const forbidden = ['crackers', 'consultancy', 'local services'];
    if (forbidden.includes(payload.category?.toLowerCase())) {
      return res.status(400).json({ error: 'Subscriptions are not supported for this category' });
    }

    // compute pricing
    const pricingResult = pricing.calculate(payload);

    // compute next delivery
    const nextDelivery = scheduler.computeNextDelivery(payload);

    const subscription = {
      id: uuidv4(),
      user_id: payload.user_id,
      category: payload.category,
      plan_type: payload.plan_type,
      frequency: pricingResult.frequency || payload.frequency || null,
      delivery_days: JSON.stringify(payload.delivery_days || []),
      items: JSON.stringify(payload.items),
      quantities: JSON.stringify(payload.quantities || {}),
      pricing: JSON.stringify(pricingResult),
      next_delivery_date: nextDelivery,
      status: 'active'
    };

    const created = await db.insertSubscription(subscription);
    return res.json({ subscription: created });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'server_error' });
  }
}

async function update(req, res) {
  try {
    const id = req.params.id;
    const changes = req.body;
    const updated = await db.updateSubscription(id, changes);
    return res.json({ subscription: updated });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'server_error' });
  }
}

async function pause(req, res) {
  try {
    const id = req.params.id;
    await db.updateSubscription(id, { status: 'paused' });
    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'server_error' });
  }
}

async function skip(req, res) {
  try {
    const id = req.params.id;
    // mark next scheduled item as skipped and compute next
    const next = await db.skipNextSchedule(id);
    return res.json({ next_delivery_date: next });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'server_error' });
  }
}

async function recommendations(req, res) {
  try {
    const input = req.query; // category, cart, user_id
    const recs = await recommender.recommend(input);
    return res.json({ recommendations: recs });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'server_error' });
  }
}

module.exports = { create, update, pause, skip, recommendations };
