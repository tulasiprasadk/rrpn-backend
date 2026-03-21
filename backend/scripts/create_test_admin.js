#!/usr/bin/env node
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { initDatabase, models } from '../config/database.js';

dotenv.config();

async function main() {
  const email = process.env.TEST_ADMIN_EMAIL || 'admin@example.com';
  const password = process.env.TEST_ADMIN_PASSWORD || 'password';
  await initDatabase();
  const { Admin } = models;
  if (!Admin) {
    console.error('Admin model not available.');
    process.exit(1);
  }

  const hashed = await bcrypt.hash(password, 10);

  let admin = await Admin.findOne({ where: { email } });
  if (admin) {
    await admin.update({ password: hashed, isActive: true, isApproved: true, role: 'super_admin', name: 'Local Test Admin' });
    console.log('Updated existing admin:', email);
  } else {
    admin = await Admin.create({
      name: 'Local Test Admin',
      email,
      password: hashed,
      role: 'super_admin',
      isActive: true,
      isApproved: true,
    });
    console.log('Created admin:', email);
  }

  console.log('Admin id:', admin.id);
  console.log('Use this account to request OTP in dev. Password not used for OTP login.');
  process.exit(0);
}

main().catch(err => {
  console.error('Error creating test admin:', err);
  process.exit(1);
});
