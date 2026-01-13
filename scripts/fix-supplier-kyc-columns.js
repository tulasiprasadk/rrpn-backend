/**
 * Quick fix script to add KYC columns to Supplier table
 * Run: node backend/scripts/fix-supplier-kyc-columns.js
 */

import { sequelize } from "../config/database.js";

async function fixColumns() {
  try {
    console.log("🔧 Fixing Supplier table columns...\n");

    // Check database dialect
    const dialect = sequelize.getDialect();
    console.log(`Database dialect: ${dialect}\n`);

    if (dialect === "postgres") {
      // PostgreSQL
      console.log("Adding columns to PostgreSQL...");
      
      try {
        await sequelize.query(`
          ALTER TABLE suppliers 
          ADD COLUMN IF NOT EXISTS "kycSubmitted" BOOLEAN DEFAULT false
        `);
        console.log("✅ Added kycSubmitted column");
      } catch (err) {
        if (err.message.includes("already exists")) {
          console.log("ℹ️  kycSubmitted column already exists");
        } else {
          throw err;
        }
      }

      try {
        await sequelize.query(`
          ALTER TABLE suppliers 
          ADD COLUMN IF NOT EXISTS "kycSubmittedAt" TIMESTAMP
        `);
        console.log("✅ Added kycSubmittedAt column");
      } catch (err) {
        if (err.message.includes("already exists")) {
          console.log("ℹ️  kycSubmittedAt column already exists");
        } else {
          throw err;
        }
      }

      // Try to add enum values (may fail if they exist, that's ok)
      const enumValues = ['kyc_pending', 'kyc_submitted'];
      for (const value of enumValues) {
        try {
          await sequelize.query(`
            ALTER TYPE enum_suppliers_status ADD VALUE IF NOT EXISTS '${value}'
          `);
          console.log(`✅ Added '${value}' to status enum`);
        } catch (err) {
          if (err.message.includes("already exists") || err.message.includes("duplicate")) {
            console.log(`ℹ️  '${value}' already in enum`);
          } else {
            console.warn(`⚠️  Could not add '${value}': ${err.message}`);
          }
        }
      }

    } else if (dialect === "sqlite") {
      // SQLite - use direct ALTER TABLE (SQLite 3.2.0+ supports it)
      console.log("SQLite detected - checking columns...");
      
      const [results] = await sequelize.query(`
        PRAGMA table_info(suppliers)
      `);
      
      const columns = results.map(r => r.name);
      console.log("Existing columns:", columns.join(", "));

      // Add kycSubmitted if missing
      if (!columns.includes("kycSubmitted")) {
        console.log("➕ Adding kycSubmitted column...");
        try {
          await sequelize.query(`
            ALTER TABLE suppliers ADD COLUMN kycSubmitted BOOLEAN DEFAULT 0
          `);
          console.log("✅ Added kycSubmitted column");
        } catch (err) {
          if (err.message.includes("duplicate") || err.message.includes("already exists")) {
            console.log("ℹ️  kycSubmitted column already exists");
          } else {
            throw err;
          }
        }
      } else {
        console.log("✅ kycSubmitted column already exists");
      }

      // Add kycSubmittedAt if missing
      if (!columns.includes("kycSubmittedAt")) {
        console.log("➕ Adding kycSubmittedAt column...");
        try {
          await sequelize.query(`
            ALTER TABLE suppliers ADD COLUMN kycSubmittedAt DATETIME
          `);
          console.log("✅ Added kycSubmittedAt column");
        } catch (err) {
          if (err.message.includes("duplicate") || err.message.includes("already exists")) {
            console.log("ℹ️  kycSubmittedAt column already exists");
          } else {
            throw err;
          }
        }
      } else {
        console.log("✅ kycSubmittedAt column already exists");
      }

      // Note: SQLite doesn't support ENUM, so status is stored as TEXT
      // The new enum values will work automatically
      console.log("ℹ️  SQLite uses TEXT for status - new enum values will work automatically");
    }

    console.log("\n✅ Fix completed!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error(error);
    process.exit(1);
  }
}

fixColumns();
