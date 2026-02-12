#!/usr/bin/env node
import { models, sequelize } from "../config/database.js";

const POLL_INTERVAL_MS = Number(process.env.ACTIVATION_POLL_MS || 2000);
const MAX_ATTEMPTS = 5;

async function processOne() {
  const { ActivationJob, Product, ItemActivationAudit } = models || {};
  if (!ActivationJob || !Product) return;

  const job = await ActivationJob.findOne({ where: { status: 'pending' }, order: [['createdAt','ASC']] });
  if (!job) return;

  try {
    // Attempt to activate product
    const product = await Product.findByPk(job.ProductId);
    if (!product) {
      await job.update({ status: 'failed', lastError: 'Product not found' });
      return;
    }

    if (product.active) {
      await job.update({ status: 'done' });
      await ItemActivationAudit.create({ ProductId: job.ProductId, action: 'noop_already_active', userId: null });
      return;
    }

    await sequelize.transaction(async (t) => {
      await Product.update({ active: true }, { where: { id: job.ProductId }, transaction: t });
      await ItemActivationAudit.create({ ProductId: job.ProductId, action: 'activated_auto', userId: null }, { transaction: t });
      await job.update({ status: 'done' }, { transaction: t });
    });
    console.log(`Activated product ${job.ProductId}`);
  } catch (err) {
    console.error('Activation error for job', job.id, err.message || err);
    const attempts = (job.attempts || 0) + 1;
    const updates = { attempts, lastError: (err.message || String(err)).slice(0, 200) };
    if (attempts >= MAX_ATTEMPTS) updates.status = 'failed';
    await job.update(updates);
  }
}

async function loop() {
  while (true) {
    try {
      await processOne();
    } catch (e) {
      console.error('Worker loop error:', e.message || e);
    }
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
}

if (require.main === module) {
  console.log('Starting activation worker...');
  loop();
}

export default { loop };
