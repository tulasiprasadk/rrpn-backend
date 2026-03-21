/**
 * Migration Script: Add missing columns to Orders table
 * Run this once to add productId, qty, supplierId, CustomerId columns
 * 
 * Usage: node scripts/add-order-columns.js
 */

import "dotenv/config";
import { sequelize, models } from "../config/database.js";
import { initDatabase } from "../config/database.js";

async function addOrderColumns() {
  try {
    console.log("🔄 Connecting to database...");
    await initDatabase();
    
    console.log("🔄 Adding missing columns to Orders table...");
    
    const queryInterface = sequelize.getQueryInterface();
    
    // Check if columns exist and add them if they don't
    const tableDescription = await queryInterface.describeTable('Orders');
    
    const columnsToAdd = [];
    
    if (!tableDescription.productId) {
      columnsToAdd.push({
        name: 'productId',
        type: 'INTEGER',
        allowNull: false,
        references: { model: 'Products', key: 'id' }
      });
    } else {
      console.log("✅ productId column already exists");
    }
    
    if (!tableDescription.qty) {
      columnsToAdd.push({
        name: 'qty',
        type: 'INTEGER',
        allowNull: false,
        defaultValue: 1
      });
    } else {
      console.log("✅ qty column already exists");
    }
    
    if (!tableDescription.supplierId) {
      columnsToAdd.push({
        name: 'supplierId',
        type: 'INTEGER',
        allowNull: true,
        references: { model: 'Suppliers', key: 'id' }
      });
    } else {
      console.log("✅ supplierId column already exists");
    }
    
    if (!tableDescription.CustomerId) {
      columnsToAdd.push({
        name: 'CustomerId',
        type: 'INTEGER',
        allowNull: true,
        references: { model: 'customers', key: 'id' }
      });
    } else {
      console.log("✅ CustomerId column already exists");
    }
    
    if (columnsToAdd.length === 0) {
      console.log("✅ All columns already exist. No migration needed.");
      process.exit(0);
    }
    
    // Add columns one by one
    for (const column of columnsToAdd) {
      try {
        console.log(`🔄 Adding column: ${column.name}...`);
        await queryInterface.addColumn('Orders', column.name, {
          type: column.type,
          allowNull: column.allowNull,
          defaultValue: column.defaultValue,
          references: column.references
        });
        console.log(`✅ Added column: ${column.name}`);
      } catch (err) {
        if (err.message && (err.message.includes('already exists') || err.message.includes('duplicate'))) {
          console.log(`⚠️  Column ${column.name} already exists (skipping)`);
        } else {
          console.error(`❌ Error adding column ${column.name}:`, err.message);
          throw err;
        }
      }
    }
    
    console.log("✅ Migration completed successfully!");
    process.exit(0);
    
  } catch (err) {
    console.error("❌ Migration failed:", err);
    console.error("Error details:", err.message);
    process.exit(1);
  }
}

addOrderColumns();
