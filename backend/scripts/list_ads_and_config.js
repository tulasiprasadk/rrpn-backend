#!/usr/bin/env node
import dotenv from 'dotenv';
import { initDatabase, models } from '../config/database.js';

dotenv.config();

async function run() {
  await initDatabase();
  const { FeaturedAd, PlatformConfig } = models;
  if (!FeaturedAd) {
    console.error('FeaturedAd model not available');
    process.exit(1);
  }

  const ads = await FeaturedAd.findAll({ order: [['type','ASC'], ['weight','DESC'], ['id','DESC']] });
  console.log('FeaturedAds:', ads.map(a => (a.toJSON ? a.toJSON() : a)));

  if (PlatformConfig) {
    const keys = ['mega_ads_left','mega_ads_right','scrolling_ads','checkout_ads','checkout_offers'];
    const configs = {};
    for (const k of keys) {
      const row = await PlatformConfig.findByPk(k);
      configs[k] = row ? { key: row.key, type: row.type, value: row.type === 'json' ? JSON.parse(row.value) : row.value } : null;
    }
    console.log('PlatformConfig keys:', configs);
  } else {
    console.log('PlatformConfig model not present');
  }

  process.exit(0);
}

run().catch(e => { console.error('Error:', e); process.exit(1); });
