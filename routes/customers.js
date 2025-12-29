
import express from "express";
import passport from "passport";
import jwt from "jsonwebtoken";
import customerRoutes from "./customer/index.js";

const router = express.Router();

// Google OAuth routes
router.get('/auth/google',
  passport.authenticate('customer-google', { scope: ['profile', 'email'] })
);

router.get('/auth/google/callback',
  passport.authenticate('customer-google', {
    failureRedirect: '/login',
    session: true
  }),
  (req, res) => {
<<<<<<< HEAD
    // Generate JWT token (minimal, for demo; use a real secret in production)
    const jwt = require('jsonwebtoken');
=======
>>>>>>> 6ad866bc3b02abfaafe4c4d9ece89858474b19cd
    const token = jwt.sign(
      { id: req.user.id, email: req.user.email, role: 'user' },
      process.env.JWT_SECRET || 'dev-secret',
      { expiresIn: '7d' }
    );
    res.redirect(`http://localhost:5173/oauth-success?token=${token}&role=user`);
  }
);

<<<<<<< HEAD
// Mount all other customer routes (auth, address, cart, etc.)
router.use('/', require('./customer'));

module.exports = router;
=======
// Mount all other customer routes
router.use('/', customerRoutes);

export default router;
>>>>>>> 6ad866bc3b02abfaafe4c4d9ece89858474b19cd
