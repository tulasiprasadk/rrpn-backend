import express from "express";
import { models } from "../config/database.js";

const router = express.Router();
const { Ad, FeaturedAd } = models;

router.get("/", async (req, res) => {
  try {
    // legacy Ad model
    const ads = Ad ? await Ad.findAll() : [];
    res.json(ads);
  } catch (err) {
    console.error("Error fetching ads:", err);
    res.status(500).json({ error: "Failed to fetch ads" });
  }
});

// Public endpoint: get active mega-grid ads
router.get('/mega', async (req, res) => {
  try {
    if (!FeaturedAd) return res.json([]);
    const now = new Date();
    const rows = await FeaturedAd.findAll({
      where: {
        type: 'mega',
        active: true,
        [models.sequelize.Op.or]: [
          { scheduleFrom: null, scheduleTo: null },
          { scheduleFrom: { [models.sequelize.Op.lte]: now }, scheduleTo: { [models.sequelize.Op.or]: [ { [models.sequelize.Op.gte]: now }, null ] } }
        ]
      },
      order: [['weight','DESC'], ['updatedAt','DESC']]
    });
    res.json(rows || []);
  } catch (err) {
    console.error('Error fetching mega ads', err);
    res.status(500).json([]);
  }
});

// Public endpoint: get active scroll ads
router.get('/scroll', async (req, res) => {
  try {
    if (!FeaturedAd) return res.json([]);
    const now = new Date();
    const rows = await FeaturedAd.findAll({
      where: {
        type: 'scroll',
        active: true,
        [models.sequelize.Op.or]: [
          { scheduleFrom: null, scheduleTo: null },
          { scheduleFrom: { [models.sequelize.Op.lte]: now }, scheduleTo: { [models.sequelize.Op.or]: [ { [models.sequelize.Op.gte]: now }, null ] } }
        ]
      },
      order: [['weight','DESC'], ['updatedAt','DESC']]
    });
    res.json(rows || []);
  } catch (err) {
    console.error('Error fetching scroll ads', err);
    res.status(500).json([]);
  }
});

export default router;
