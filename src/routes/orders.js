import express from "express";

import {
  createOrder,
  createGuestOrder,
  getOrderById
} from "../controllers/orderController.js";

const router = express.Router();

router.post("/create", createOrder);
router.post("/create-guest", createGuestOrder);
router.get("/:id", getOrderById);

export default router;