/**
 * Script to create a new admin with different credentials
 * Run: node backend/scripts/create-new-admin.js
 */

import bcrypt from 'bcrypt';
import { models, sequelize } from '../config/database.js';
const { Admin } = models;

async function createNewAdmin() {
  try {
    await sequelize.sync();

    // Delete existing admin
    const existing = await Admin.findOne({ where: { email: 'admin@rrnagar.com' } });
    if (existing) {
      await existing.destroy();
      console.log('✅ Deleted existing admin');
    }

    // Create new admin with new credentials
    const email = 'admin@rrnagar.com';
    const password = 'Admin@2024'; // New password
    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await Admin.create({
      name: 'Super Admin',
      email: email,
      password: hashedPassword,
      role: 'super_admin',
      isActive: true,
      isApproved: true,
      approvedAt: new Date()
    });

    // Verify
    const testMatch = await bcrypt.compare(password, admin.password);
    
    console.log('✅ New admin created successfully!');
    console.log('   Email:', admin.email);
    console.log('   Password:', password);
    console.log('   Password verified:', testMatch);
    console.log('   Role:', admin.role);
    console.log('\n⚠️  NEW CREDENTIALS:');
    console.log('   Email: admin@rrnagar.com');
    console.log('   Password: Admin@2024');
    console.log('\n⚠️  Please use these new credentials to login!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

createNewAdmin();
