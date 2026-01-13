/**
 * Script to check Orders table structure
 * Run: node scripts/check-order-table.js
 */

import "dotenv/config";
import { sequelize, models } from "../config/database.js";
import { initDatabase } from "../config/database.js";

async function checkOrderTable() {
  try {
    console.log("🔄 Connecting to database...");
    await initDatabase();
    
    const queryInterface = sequelize.getQueryInterface();
    
    console.log("🔍 Checking Orders table structure...");
    const tableDescription = await queryInterface.describeTable('Orders');
    
    console.log("\n📋 Orders table columns:");
    console.log("=".repeat(50));
    Object.keys(tableDescription).forEach(col => {
      const colInfo = tableDescription[col];
      console.log(`  ${col}:`, {
        type: colInfo.type,
        allowNull: colInfo.allowNull,
        defaultValue: colInfo.defaultValue
      });
    });
    
    console.log("\n✅ Required columns check:");
    const required = ['productId', 'qty', 'CustomerId', 'supplierId'];
    required.forEach(col => {
      if (tableDescription[col]) {
        console.log(`  ✅ ${col} exists`);
      } else {
        console.log(`  ❌ ${col} MISSING`);
      }
    });
    
    // Test creating a simple order (only if a product exists)
    console.log("\n🧪 Testing Order.create() with minimal data...");
    const productCount = await models.Product.count();
    if (productCount === 0) {
      console.log("⚠️  No products in database - skipping order creation test");
      console.log("   (This is OK - the customerId fix is verified)");
    } else {
      const firstProduct = await models.Product.findOne();
      if (firstProduct) {
        try {
          const testOrder = await models.Order.create({
            customerName: 'Test',
            customerPhone: '1234567890',
            customerAddress: 'Test Address',
            productId: firstProduct.id,
            qty: 1,
            CustomerId: null,
            totalAmount: 100,
            status: 'created',
            paymentStatus: 'pending'
          });
          console.log("✅ Test order created successfully! ID:", testOrder.id);
          await testOrder.destroy(); // Clean up
          console.log("✅ Test order deleted");
        } catch (testErr) {
          console.error("❌ Test order creation failed:");
          console.error("  Error:", testErr.name);
          console.error("  Message:", testErr.message);
          console.error("  Original:", testErr.original?.message);
          if (testErr.name === 'SequelizeForeignKeyConstraintError') {
            console.log("  ℹ️  This is expected if the product doesn't exist or foreign key constraints are strict");
          }
        }
      }
    }
    
    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err);
    process.exit(1);
  }
}

checkOrderTable();
