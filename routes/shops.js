
import express from 'express';
import { models } from "../config/database.js";
const { Shop } = models;

const router = express.Router();

// GET all shops
router.get('/', async (req, res) => {
  try {
    const shops = await Shop.findAll();
    res.json(shops);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// CREATE shop
router.post('/', async (req, res) => {
  try {
    const shop = await Shop.create(req.body);
    res.json(shop);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
