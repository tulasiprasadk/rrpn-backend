#!/usr/bin/env node
import 'dotenv/config';
import bcrypt from 'bcrypt';
import { models, sequelize } from '../config/database.js';

async function run() {
  try {
    await sequelize.sync();

    const email = process.env.ADMIN_EMAIL || 'admin@local';
    const password = process.env.ADMIN_PASSWORD || 'devpass123';
    const name = process.env.ADMIN_NAME || 'Local Admin';
    const role = process.env.ADMIN_ROLE || 'super_admin';

    const { Admin } = models;
    if (!Admin) throw new Error('Admin model not available');

    let admin = await Admin.findOne({ where: { email } });
    const hashed = await bcrypt.hash(password, 10);

    if (admin) {
      console.log('Admin exists — updating password and approving');
      await admin.update({ password: hashed, isApproved: true, role, approvedAt: new Date() });
    } else {
      admin = await Admin.create({ name, email, password: hashed, role, isApproved: true, approvedAt: new Date(), isActive: true });
      console.log('Created admin:', email);
    }

    console.log('\nAdmin ready for local testing:');
    console.log('  email:', email);
    console.log('  password:', password);
    process.exit(0);
  } catch (err) {
    console.error('Failed to create admin:', err);
    process.exit(1);
  }
}

run();
