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

const googleConfigured = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

// Preferred single callback env variable. Fall back to older per-type vars if present.
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL;
const defaultSupplierCallback = (process.env.BACKEND_URL || 'http://localhost:3000') + '/api/suppliers/auth/google/callback';
const defaultCustomerCallback = (process.env.BACKEND_URL || 'http://localhost:3000') + '/api/customers/auth/google/callback';

if (googleConfigured) {
  // Warn if older callback vars are present but recommend standardizing to GOOGLE_CALLBACK_URL
  if (process.env.GOOGLE_CUSTOMER_CALLBACK_URL || process.env.GOOGLE_SUPPLIER_CALLBACK_URL) {
    console.warn('Notice: Detected legacy GOOGLE_CUSTOMER_CALLBACK_URL or GOOGLE_SUPPLIER_CALLBACK_URL. Prefer setting GOOGLE_CALLBACK_URL for both callbacks to standardize production config.');
  }

  passport.use('supplier-google', new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: GOOGLE_CALLBACK_URL || process.env.GOOGLE_SUPPLIER_CALLBACK_URL || defaultSupplierCallback,
  }, async (accessToken, refreshToken, profile, done) => {
  try {
    const { Supplier: SupplierModel } = await getModels();
    const email = profile.emails[0].value;
    let supplier = await SupplierModel.findOne({ where: { email } });
    if (!supplier) {
      supplier = await SupplierModel.create({
        name: profile.displayName,
        email,
        status: 'pending', // After Google login, supplier needs to complete KYC
        acceptedTnC: false,
        kycSubmitted: false
      });
    }
    return done(null, supplier);
  } catch (err) {
    return done(err);
  }
  }));

  // Google OAuth for Customer (user)
  passport.use('customer-google', new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: GOOGLE_CALLBACK_URL || process.env.GOOGLE_CUSTOMER_CALLBACK_URL || defaultCustomerCallback,
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
