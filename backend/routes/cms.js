import express from 'express';
import { models } from "../config/database.js";
import { getDefaultCmsAds } from "../utils/defaultAds.js";

const { PlatformConfig } = models;
const router = express.Router();

function parseConfigJson(config, fallback = []) {
  if (!config) {
    return fallback;
  }

  let value = config.value;
  if (config.type === 'json') {
    try {
      value = JSON.parse(value);
    } catch (err) {
      value = fallback;
    }
  }

  return Array.isArray(value) && value.length > 0 ? value : fallback;
}

// Get discover section (public)
router.get('/discover', async (req, res) => {
  try {
    const config = await PlatformConfig.findByPk('discover_section');
    if (!config) {
      return res.json([]);
    }
    
    let value = config.value;
      if (config.type === 'json') {
      try {
        value = JSON.parse(value);
      } catch (err) {
        value = [];
      }
    }
    
    res.json(Array.isArray(value) ? value : []);
  } catch (err) {
    console.error('Get discover error:', err);
    res.json([]);
  }
});

// Get mega ads (public)
router.get('/mega-ads/:position', async (req, res) => {
  try {
    const { position } = req.params; // 'left' or 'right'
    const key = `mega_ads_${position}`;
    const config = await PlatformConfig.findByPk(key);

    res.json(parseConfigJson(config, getDefaultCmsAds(key)));
  } catch (err) {
    console.error('Get mega ads error:', err);
    res.json(getDefaultCmsAds(`mega_ads_${req.params.position}`));
  }
});

// Get scrolling ads (public)
router.get('/scrolling-ads', async (req, res) => {
  try {
    const config = await PlatformConfig.findByPk('scrolling_ads');
    res.json(parseConfigJson(config, getDefaultCmsAds('scrolling_ads')));
  } catch (err) {
    console.error('Get scrolling ads error:', err);
    res.json(getDefaultCmsAds('scrolling_ads'));
  }
});

// Get checkout offers (public)
router.get('/checkout-offers', async (req, res) => {
  try {
    const config = await PlatformConfig.findByPk('checkout_offers');
    if (!config) {
      return res.json([]);
    }

    let value = config.value;
    if (config.type === 'json') {
      try {
        value = JSON.parse(value);
      } catch (err) {
        value = [];
      }
    }

    res.json(Array.isArray(value) ? value : []);
  } catch (err) {
    console.error('Get checkout offers error:', err);
    res.json([]);
  }
});

// Get checkout ads (public)
router.get('/checkout-ads', async (req, res) => {
  try {
    const config = await PlatformConfig.findByPk('checkout_ads');
    res.json(parseConfigJson(config, getDefaultCmsAds('checkout_ads')));
  } catch (err) {
    console.error('Get checkout ads error:', err);
    res.json(getDefaultCmsAds('checkout_ads'));
  }
});

export default router;
