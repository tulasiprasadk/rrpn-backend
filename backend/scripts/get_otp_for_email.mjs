import { models } from '../config/database.js';
const { Customer } = models;
const email = process.argv[2];
if (!email) {
  console.error('Usage: node get_otp_for_email.mjs <email>');
  process.exit(2);
}
(async ()=>{
  const c = await Customer.findOne({ where: { email } });
  if (!c) return console.error('NOT_FOUND');
  console.log(JSON.stringify({ email: c.email, otpCode: c.otpCode, otpExpiresAt: c.otpExpiresAt }));
})();
