#!/usr/bin/env node
import 'dotenv/config';
import { models, sequelize } from '../config/database.js';

async function run() {
  try {
    await sequelize.sync();
    const { Supplier } = models;
    if (!Supplier) throw new Error('Supplier model not available');

    const email = process.env.TEST_SUPPLIER_EMAIL || 'supplier@example.com';
    let s = await Supplier.findOne({ where: { email } });
    if (s) {
      console.log('Test supplier already exists:', email);
      process.exit(0);
    }

    s = await Supplier.create({
      name: 'Test Supplier',
      businessName: 'Test Business',
      email,
      phone: '9999999999',
      address: 'Local test address',
      status: 'kyc_submitted',
      kycSubmitted: true,
      kycSubmittedAt: new Date()
    });

    console.log('Created test supplier:', s.id, s.email);
    process.exit(0);
  } catch (err) {
    console.error('Failed to create test supplier:', err);
    process.exit(1);
  }
}

run();
