import express from "express";
import { models } from "../config/database.js";

const router = express.Router();
const { Ad } = models;

router.get("/", async (req, res) => {
  try {
    const ads = await Ad.findAll();
    res.json(ads);
  } catch (err) {
    console.error("Error fetching ads:", err);
    res.status(500).json({ error: "Failed to fetch ads" });
  }
});

export default router;
