import { models, sequelize } from '../config/database.js';

const { Customer } = models;

async function run() {
  try {
    // Fallback: fetch recent customers and find one matching the e2e_test_ prefix
    const recent = await Customer.findAll({ order: [['id', 'DESC']], limit: 50 });
    const customer = recent.find(c => typeof c.email === 'string' && c.email.startsWith('e2e_test_'));
    if (!customer) {
      console.error('No e2e_test_ customer found.');
      process.exit(1);
    }
    const otp = '123456';
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await customer.update({ otpCode: otp, otpExpiresAt: expiresAt });
    console.log('Set OTP for customer:', customer.email, otp);
    process.exit(0);
  } catch (err) {
    console.error('Error setting OTP:', err);
    process.exit(2);
  }
}

run();
