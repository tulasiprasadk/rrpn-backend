#!/usr/bin/env node
import dotenv from 'dotenv';
import { initDatabase, models } from '../config/database.js';

dotenv.config();

async function run() {
  await initDatabase();
  const { PlatformConfig } = models;
  if (!PlatformConfig) {
    console.error('PlatformConfig model not available');
    process.exit(1);
  }

  const samples = {
    mega_ads_left: [
      { title: 'Mega Left 1', image: '/ads/mega-left.png', link: '/' }
    ],
    mega_ads_right: [
      { title: 'Mega Right 1', image: '/ads/mega-right.png', link: '/' }
    ],
    scrolling_ads: [
      { title: 'Scrolling 1', image: '/ads/scroll-1.png', link: '/' }
    ],
    checkout_ads: [
      { title: 'Fresh Picks', text: 'Daily fresh groceries', image: '/ads/grid-1.jpg', link: '/groceries' },
      { title: 'Essentials Sale', text: 'Save on essentials', image: '/ads/grid-2.jpg', link: '/groceries' }
    ],
    checkout_offers: [
      { title: '10% OFF', description: 'On orders above ₹500', code: 'SAVE10', type: 'percent', value: 10 }
    ]
  };

  for (const [key, value] of Object.entries(samples)) {
    const existing = await PlatformConfig.findByPk(key);
    const payload = {
      key,
      value: JSON.stringify(value),
      type: 'json',
      description: 'Seeded by dev script',
      category: 'cms'
    };
    if (existing) {
      await PlatformConfig.update({ value: payload.value, type: payload.type, description: payload.description, category: payload.category }, { where: { key } });
      console.log('Updated', key);
    } else {
      await PlatformConfig.create(payload);
      console.log('Created', key);
    }
  }

  console.log('PlatformConfig ad keys seeded.');
  process.exit(0);
}

run().catch(e => { console.error('Error seeding platform config:', e); process.exit(1); });
