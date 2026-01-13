import express from 'express';
import { models } from "../config/database.js";

const { PlatformConfig } = models;
const router = express.Router();

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
      } catch {
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
    
    if (!config) {
      return res.json([]);
    }
    
    let value = config.value;
    if (config.type === 'json') {
      try {
        value = JSON.parse(value);
      } catch {
        value = [];
      }
    }
    
    res.json(Array.isArray(value) ? value : []);
  } catch (err) {
    console.error('Get mega ads error:', err);
    res.json([]);
  }
});

// Get scrolling ads (public)
router.get('/scrolling-ads', async (req, res) => {
  try {
    const config = await PlatformConfig.findByPk('scrolling_ads');
    if (!config) {
      return res.json([]);
    }
    
    let value = config.value;
    if (config.type === 'json') {
      try {
        value = JSON.parse(value);
      } catch {
        value = [];
      }
    }
    
    res.json(Array.isArray(value) ? value : []);
  } catch (err) {
    console.error('Get scrolling ads error:', err);
    res.json([]);
  }
});

export default router;
