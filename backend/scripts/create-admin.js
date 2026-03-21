/**
 * Script to create initial admin user
 * Run: node backend/scripts/create-admin.js
 */


import bcrypt from 'bcrypt';
import { models, sequelize } from '../config/database.js';
const { Admin } = models;

async function createAdmin() {
  try {
    await sequelize.sync();

    // Check if admin already exists
    const existing = await Admin.findOne({ where: { email: 'admin@rrnagar.com' } });
    
    if (existing) {
      console.log('❌ Admin already exists with email: admin@rrnagar.com');
      console.log('   Use a different email or delete the existing admin first.');
      process.exit(0);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Check if this is the first admin (auto-approve first admin)
    const adminCount = await Admin.count();
    const isFirstAdmin = adminCount === 0;

    // Create admin
    const admin = await Admin.create({
      name: 'Admin',
      email: 'admin@rrnagar.com',
      password: hashedPassword,
      role: 'super_admin',
      isActive: true,
      isApproved: isFirstAdmin, // Auto-approve first admin
      approvedAt: isFirstAdmin ? new Date() : null,
      approvedBy: isFirstAdmin ? null : null // First admin approves themselves
    });

    console.log('✅ Admin user created successfully!');
    console.log('   Email: admin@rrnagar.com');
    console.log('   Password: admin123');
    console.log('   Role:', admin.role);
    console.log('\n⚠️  Please change the password after first login!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
    process.exit(1);
  }
}

createAdmin();
