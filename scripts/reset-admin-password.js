/**
 * Script to reset admin password
 * Run: node backend/scripts/reset-admin-password.js
 */

import bcrypt from 'bcrypt';
import { models, sequelize } from '../config/database.js';
const { Admin } = models;

async function resetPassword() {
  try {
    await sequelize.sync();

    const email = 'admin@rrnagar.com';
    const newPassword = 'admin123';

    const admin = await Admin.findOne({ where: { email } });
    
    if (!admin) {
      console.log('❌ Admin not found! Creating new admin...');
      
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      const newAdmin = await Admin.create({
        name: 'Admin',
        email: email,
        password: hashedPassword,
        role: 'super_admin',
        isActive: true,
        isApproved: true,
        approvedAt: new Date()
      });
      
      console.log('✅ Admin created!');
      console.log('   Email:', newAdmin.email);
      console.log('   Password:', newPassword);
      process.exit(0);
    }

    console.log('✅ Admin found! Resetting password...');
    
    // Reset password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await admin.update({
      password: hashedPassword,
      isActive: true,
      isApproved: true,
      approvedAt: admin.approvedAt || new Date()
    });

    // Verify the password works
    const testMatch = await bcrypt.compare(newPassword, hashedPassword);
    
    console.log('✅ Password reset successful!');
    console.log('   Email:', admin.email);
    console.log('   New Password:', newPassword);
    console.log('   Password hash verified:', testMatch);
    console.log('   isActive:', admin.isActive);
    console.log('   isApproved:', admin.isApproved);
    console.log('\n⚠️  You can now login with:');
    console.log('   Email: admin@rrnagar.com');
    console.log('   Password: admin123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

resetPassword();
