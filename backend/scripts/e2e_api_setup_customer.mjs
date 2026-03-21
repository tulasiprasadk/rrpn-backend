import { models } from '../config/database.js';

const { Customer } = models;

(async function() {
  try {
    const email = `e2e_api_${Date.now()}@example.com`;
    const otp = '999999';
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const customer = await Customer.create({ email, name: 'E2E API Test' });
    await customer.update({ otpCode: otp, otpExpiresAt: expiresAt });

    console.log(JSON.stringify({ email, otp }));
    process.exit(0);
  } catch (err) {
    console.error('ERR', err);
    process.exit(2);
  }
})();
