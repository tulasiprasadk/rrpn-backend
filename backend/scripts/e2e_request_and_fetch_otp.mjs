import fetch from 'node-fetch';
import fs from 'fs';
import { models } from '../config/database.js';
const { Customer } = models;

(async ()=>{
  try {
    const email = `e2e_api_${Date.now()}@example.com`;
    const res = await fetch('http://127.0.0.1:3000/api/auth/request-email-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const body = await res.text();
    console.log('request-email-otp response status:', res.status, 'body:', body);

    // Fetch OTP from DB
    const c = await Customer.findOne({ where: { email } });
    if (!c) {
      console.error('Customer not found after request');
      process.exit(2);
    }
    console.log('Email created:', email, 'OTP in DB:', c.otpCode);
    fs.writeFileSync('d:/RRPN/backend/e2e_api_email.txt', email, 'utf8');
    process.exit(0);
  } catch (err) {
    console.error('E2E request error', err);
    process.exit(3);
  }
})();
