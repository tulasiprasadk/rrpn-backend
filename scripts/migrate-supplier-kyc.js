/**
 * Migration script to add KYC fields to Supplier table
 * Run: node backend/scripts/migrate-supplier-kyc.js
 */

import { sequelize } from "../config/database.js";
import { QueryTypes } from "sequelize";

async function migrateSupplierKYC() {
  try {
    console.log("🔄 Starting Supplier KYC migration...\n");

    // Check if columns already exist
    const [results] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'suppliers' 
      AND column_name IN ('kycSubmitted', 'kycSubmittedAt')
    `);

    const existingColumns = results.map((r) => r.column_name);
    console.log("Existing columns:", existingColumns);

    // Add kycSubmitted column if it doesn't exist
    if (!existingColumns.includes("kycSubmitted")) {
      console.log("➕ Adding kycSubmitted column...");
      await sequelize.query(`
        ALTER TABLE suppliers 
        ADD COLUMN "kycSubmitted" BOOLEAN DEFAULT false
      `);
      console.log("✅ Added kycSubmitted column");
    } else {
      console.log("✅ kycSubmitted column already exists");
    }

    // Add kycSubmittedAt column if it doesn't exist
    if (!existingColumns.includes("kycSubmittedAt")) {
      console.log("➕ Adding kycSubmittedAt column...");
      await sequelize.query(`
        ALTER TABLE suppliers 
        ADD COLUMN "kycSubmittedAt" TIMESTAMP
      `);
      console.log("✅ Added kycSubmittedAt column");
    } else {
      console.log("✅ kycSubmittedAt column already exists");
    }

    // Update status enum to include new values
    console.log("\n🔄 Checking status enum...");
    
    // Check current enum values
    const [enumCheck] = await sequelize.query(`
      SELECT 
        t.typname as enum_name,
        e.enumlabel as enum_value
      FROM pg_type t 
      JOIN pg_enum e ON t.oid = e.enumtypid  
      WHERE t.typname = 'enum_suppliers_status'
      ORDER BY e.enumsortorder
    `);

    const currentValues = enumCheck.map((e) => e.enum_value);
    console.log("Current status values:", currentValues);

    const requiredValues = ["pending", "kyc_pending", "kyc_submitted", "approved", "rejected"];
    const missingValues = requiredValues.filter((v) => !currentValues.includes(v));

    if (missingValues.length > 0) {
      console.log("➕ Adding missing status values:", missingValues);
      
      // For PostgreSQL, we need to add enum values one by one
      for (const value of missingValues) {
        try {
          await sequelize.query(`
            ALTER TYPE enum_suppliers_status ADD VALUE IF NOT EXISTS '${value}'
          `);
          console.log(`  ✅ Added '${value}' to status enum`);
        } catch (err) {
          // IF NOT EXISTS might not work in all PostgreSQL versions
          if (err.message.includes("already exists")) {
            console.log(`  ℹ️  '${value}' already exists in enum`);
          } else {
            console.warn(`  ⚠️  Could not add '${value}':`, err.message);
          }
        }
      }
    } else {
      console.log("✅ All required status values exist");
    }

    console.log("\n✅ Migration completed successfully!");
    console.log("\n📝 Note: If you see errors about enum values, you may need to:");
    console.log("   1. Drop and recreate the enum type, or");
    console.log("   2. Manually add the values in your database");

    process.exit(0);
  } catch (error) {
    console.error("❌ Migration error:", error);
    
    // If it's SQLite, handle differently
    if (error.message.includes("SQLITE") || sequelize.getDialect() === "sqlite") {
      console.log("\n📝 SQLite detected - trying alternative approach...");
      try {
        // SQLite doesn't support ALTER TABLE ADD COLUMN easily
        // We'll need to recreate the table or use a different approach
        console.log("⚠️  SQLite requires manual migration or table recreation");
        console.log("   Please update your database schema manually or use Sequelize sync");
      } catch (sqliteErr) {
        console.error("SQLite migration error:", sqliteErr);
      }
    }
    
    process.exit(1);
  }
}

migrateSupplierKYC();
