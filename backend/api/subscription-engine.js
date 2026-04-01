import express from 'express';
import { insertSubscription, updateSubscription, skipNextSchedule, recommendFor } from '../services/subscriptionDb.js';
import { calculatePricing, computeNextDelivery, recommend } from '../services/subscriptionLogic.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

router.post('/create', async (req, res) => {
  try {
    const payload = req.body || {};
    if (!payload.user_id || !payload.category || !payload.type || !payload.items) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const forbidden = ['crackers', 'consultancy', 'local services'];
    if (forbidden.includes(payload.category?.toLowerCase())) {
      return res.status(400).json({ error: 'Subscriptions are not supported for this category' });
    }

    const pricing = await calculatePricing(payload);
    const nextDelivery = computeNextDelivery(payload);

    const toInsert = {
      user_id: payload.user_id,
      category: payload.category,
      type: payload.type, // 'frequency', 'bundle', 'service'
      plan_name: payload.plan_name,
      family_size: payload.family_size,
      frequency: pricing.frequency || payload.frequency || null,
      delivery_days: JSON.stringify(payload.delivery_days || []),
      items: JSON.stringify(payload.items),
      quantities: JSON.stringify(payload.quantities || {}),
      pricing: JSON.stringify(pricing),
      next_delivery_date: nextDelivery,
      status: 'active',
    };

    const created = await insertSubscription(toInsert);
    return res.json({ subscription: created });
  } catch (err) {
    console.error('subscription-engine create error', err);
    res.status(500).json({ error: 'server_error' });
  }
});

router.put('/update/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const changes = req.body || {};
    const updated = await updateSubscription(id, changes);
    res.json({ subscription: updated });
  } catch (err) {
    console.error('subscription-engine update error', err);
    res.status(500).json({ error: 'server_error' });
  }
});

router.post('/skip/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const next = await skipNextSchedule(id);
    res.json({ next_delivery_date: next });
  } catch (err) {
    console.error('subscription-engine skip error', err);
    res.status(500).json({ error: 'server_error' });
  }
});

router.get('/recommendations', async (req, res) => {
  try {
    const recs = await recommend(req.query);
    // persist to recommendations table in background
    if (req.query.user_id) {
      try {
        await recommendFor(req.query.user_id, recs);
      } catch (e) {
        console.warn('Failed to persist recommendations', e?.message || e);
      }
    }
    res.json({ recommendations: recs });
  } catch (err) {
    console.error('subscription-engine recommendations error', err);
    res.status(500).json({ error: 'server_error' });
  }
});

router.post('/add-item', async (req, res) => {
  try {
    const { subscription_id, product_id, quantity } = req.body;
    const item = await addItemToSubscription(subscription_id, product_id, quantity);
    res.json({ success: true, item });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add item' });
  }
});
export default router;
