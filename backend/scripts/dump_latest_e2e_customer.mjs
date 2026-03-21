import { models } from '../config/database.js';
const { Customer } = models;
(async ()=>{
  const recent = await Customer.findAll({ order: [['id','DESC']], limit: 50 });
  const customer = recent.find(c => typeof c.email === 'string' && c.email.startsWith('e2e_test_'));
  if (!customer) return console.error('NOT_FOUND');
  console.log(JSON.stringify({ id: customer.id, email: customer.email, otpCode: customer.otpCode, otpExpiresAt: customer.otpExpiresAt }));
})();
