/**
 * Script to create an additional admin user
 * Run: node backend/scripts/create-additional-admin.js
 * 
 * Usage:
 *   node backend/scripts/create-additional-admin.js <email> <name> <password> [role]
 * 
 * Example:
 *   node backend/scripts/create-additional-admin.js newadmin@rrnagar.com "New Admin" "SecurePass123" admin
 */

import bcrypt from 'bcrypt';
import { models, sequelize } from '../config/database.js';
const { Admin } = models;

async function createAdditionalAdmin() {
  try {
    await sequelize.sync();

    // Get arguments from command line
    const args = process.argv.slice(2);
    
    if (args.length < 3) {
      console.log('❌ Usage: node create-additional-admin.js <email> <name> <password> [role]');
      console.log('   role options: super_admin, admin, moderator (default: admin)');
      console.log('\nExample:');
      console.log('   node create-additional-admin.js newadmin@rrnagar.com "New Admin" "SecurePass123" admin');
      process.exit(1);
    }

    const [email, name, password, role = 'admin'] = args;

    // Validate email
    if (!email.includes('@')) {
      console.log('❌ Invalid email address');
      process.exit(1);
    }

    // Validate password
    if (password.length < 6) {
      console.log('❌ Password must be at least 6 characters');
      process.exit(1);
    }

    // Validate role
    const validRoles = ['super_admin', 'admin', 'moderator'];
    if (!validRoles.includes(role)) {
      console.log(`❌ Invalid role. Must be one of: ${validRoles.join(', ')}`);
      process.exit(1);
    }

    // Check if admin already exists
    const existing = await Admin.findOne({ where: { email } });
    if (existing) {
      console.log(`❌ Admin already exists with email: ${email}`);
      process.exit(1);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Check if there are any super admins
    const superAdminCount = await Admin.count({ where: { role: 'super_admin', isApproved: true } });
    const isFirstSuperAdmin = superAdminCount === 0 && role === 'super_admin';

    // Create admin
    const admin = await Admin.create({
      name,
      email,
      password: hashedPassword,
      role,
      isActive: true,
      isApproved: isFirstSuperAdmin, // Auto-approve if first super admin
      approvedAt: isFirstSuperAdmin ? new Date() : null,
      approvedBy: isFirstSuperAdmin ? null : null
    });

    console.log('✅ Admin user created successfully!');
    console.log(`   Name: ${admin.name}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Password: ${password}`);
    console.log(`   Role: ${admin.role}`);
    console.log(`   Status: ${admin.isApproved ? '✅ Approved' : '⏳ Pending Approval'}`);
    
    if (!admin.isApproved) {
      console.log('\n⚠️  This admin needs to be approved by a super admin before they can login.');
      console.log('   A super admin can approve them from the admin panel.');
    } else {
      console.log('\n✅ Admin is approved and can login immediately!');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
    if (error.name === 'SequelizeUniqueConstraintError') {
      console.error('   Email already exists in database');
    }
    process.exit(1);
  }
}

createAdditionalAdmin();
