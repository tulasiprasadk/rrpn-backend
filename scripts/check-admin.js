/**
 * Script to check and fix admin account
 * Run: node backend/scripts/check-admin.js
 */

import bcrypt from 'bcrypt';
import { models, sequelize } from '../config/database.js';
const { Admin } = models;

async function checkAdmin() {
  try {
    await sequelize.sync();

    const admin = await Admin.findOne({ where: { email: 'admin@rrnagar.com' } });
    
    if (!admin) {
      console.log('❌ Admin not found!');
      console.log('   Creating admin account...');
      
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const newAdmin = await Admin.create({
        name: 'Admin',
        email: 'admin@rrnagar.com',
        password: hashedPassword,
        role: 'super_admin',
        isActive: true,
        isApproved: true,
        approvedAt: new Date()
      });
      
      console.log('✅ Admin created!');
      console.log('   Email: admin@rrnagar.com');
      console.log('   Password: admin123');
      console.log('   Role:', newAdmin.role);
      console.log('   Approved:', newAdmin.isApproved);
      process.exit(0);
    }

    console.log('✅ Admin found!');
    console.log('   Email:', admin.email);
    console.log('   Name:', admin.name);
    console.log('   Role:', admin.role);
    console.log('   isActive:', admin.isActive);
    console.log('   isApproved:', admin.isApproved);
    
    // Check if password is hashed
    const isHashed = admin.password.startsWith('$2b$') || admin.password.startsWith('$2a$');
    console.log('   Password is hashed:', isHashed);
    
    // Test password
    const testPassword = 'admin123';
    const passwordMatch = await bcrypt.compare(testPassword, admin.password);
    console.log('   Password "admin123" matches:', passwordMatch);
    
    // Fix issues
    let fixed = false;
    
    if (!admin.isApproved) {
      console.log('\n⚠️  Admin is not approved. Fixing...');
      await admin.update({
        isApproved: true,
        approvedAt: new Date(),
        approvedBy: null
      });
      fixed = true;
    }
    
    if (!admin.isActive) {
      console.log('\n⚠️  Admin is not active. Fixing...');
      await admin.update({ isActive: true });
      fixed = true;
    }
    
    if (!isHashed) {
      console.log('\n⚠️  Password is not hashed. Fixing...');
      const hashedPassword = await bcrypt.hash(admin.password || 'admin123', 10);
      await admin.update({ password: hashedPassword });
      fixed = true;
    }
    
    if (!passwordMatch && isHashed) {
      console.log('\n⚠️  Password does not match. Resetting to "admin123"...');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await admin.update({ password: hashedPassword });
      fixed = true;
    }
    
    if (fixed) {
      console.log('\n✅ Admin account fixed!');
      console.log('   You can now login with:');
      console.log('   Email: admin@rrnagar.com');
      console.log('   Password: admin123');
    } else {
      console.log('\n✅ Admin account is correct!');
      console.log('   You should be able to login.');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

checkAdmin();
