<<<<<<< HEAD
const express = require('express');
const router = express.Router();

// Auth, dashboard, and other customer routes
router.use('/auth', require('./auth'));
router.use('/address', require('./address'));
router.use('/dashboard-stats', require('./dashboard-stats'));
router.use('/payment', require('./payment'));
router.use('/profile', require('./profile'));
router.use('/saved-suppliers', require('./saved-suppliers'));
router.use('/cart', require('./cart'));

module.exports = router;
=======
// Importing necessary modules
import express from "express";
import auth from "./auth.js";
import address from "./address.js";
import dashboardStats from "./dashboard-stats.js";
import payment from "./payment.js";
import profile from "./profile.js";
import savedSuppliers from "./saved-suppliers.js";
import cart from "./cart.js";

const router = express.Router();

router.use('/auth', auth);
router.use('/address', address);
router.use('/dashboard-stats', dashboardStats);
router.use('/payment', payment);
router.use('/profile', profile);
router.use('/saved-suppliers', savedSuppliers);
router.use('/cart', cart);

// Exporting the router for use in other modules
export default router;
>>>>>>> 6ad866bc3b02abfaafe4c4d9ece89858474b19cd
