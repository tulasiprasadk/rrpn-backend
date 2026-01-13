// backend/passport.js

import passport from 'passport';
import pkg from 'passport-google-oauth20';
const { Strategy: GoogleStrategy } = pkg;

// Lazy load models to avoid blocking on import
let Supplier, Customer;
async function getModels() {
  if (!Supplier || !Customer) {
    const { models } = await import('./config/database.js');
    Supplier = models.Supplier;
    Customer = models.Customer;
  }
  return { Supplier, Customer };
}


// Support both Supplier and Customer serialization
passport.serializeUser((user, done) => {
  if (user?.constructor?.name === 'Supplier') {
    done(null, { id: user.id, type: 'Supplier' });
  } else {
    done(null, { id: user.id, type: 'Customer' });
  }
});

passport.deserializeUser(async (obj, done) => {
  try {
    const { Supplier: SupplierModel, Customer: CustomerModel } = await getModels();
    if (obj.type === 'Supplier') {
      const supplier = await SupplierModel.findByPk(obj.id);
      return done(null, supplier);
    } else {
      const customer = await CustomerModel.findByPk(obj.id);
      return done(null, customer);
    }
  } catch (err) {
    done(err);
  }
});

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use('supplier-google', new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_SUPPLIER_CALLBACK_URL || '/api/suppliers/auth/google/callback',
  }, async (accessToken, refreshToken, profile, done) => {
  try {
    const { Supplier: SupplierModel } = await getModels();
    const email = profile.emails[0].value;
    let supplier = await SupplierModel.findOne({ where: { email } });
    if (!supplier) {
      supplier = await SupplierModel.create({
        name: profile.displayName,
        email,
        status: 'pending', // Admin must approve
        acceptedTnC: false
      });
    }
    return done(null, supplier);
  } catch (err) {
    return done(err);
  }
  }));

  // Google OAuth for Customer (user)
  passport.use('google-customer', new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CUSTOMER_CALLBACK_URL || 'https://rrnagarfinal-backend.vercel.app/api/customers/auth/google/callback',
  }, async (accessToken, refreshToken, profile, done) => {
  try {
    const { Customer: CustomerModel } = await getModels();
    const email = profile.emails[0].value;
    let customer = await CustomerModel.findOne({ where: { email } });
    if (!customer) {
      customer = await CustomerModel.create({
        name: profile.displayName,
        email,
        username: email,
      });
    }
    return done(null, customer);
  } catch (err) {
    return done(err);
  }
  }));
} else {
  console.warn('Google OAuth not configured: set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to enable.');
}

export default passport;
