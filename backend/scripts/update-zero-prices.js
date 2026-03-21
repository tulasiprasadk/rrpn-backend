/**
 * Script to update all products with price 0 to have a minimum price
 * Run: node scripts/update-zero-prices.js [minPrice]
 * Default minPrice: 50
 */

import "dotenv/config";
import { sequelize, models } from "../config/database.js";
import { initDatabase } from "../config/database.js";
import { Op } from "sequelize";

async function updateZeroPrices() {
  try {
    console.log("🔄 Connecting to database...");
    await initDatabase();
    
    const minPrice = parseFloat(process.argv[2]) || 50; // Default to ₹50
    console.log(`💰 Setting minimum price to ₹${minPrice}`);
    
    // Find all products with price 0 or null
    const productsWithZeroPrice = await models.Product.findAll({
      where: {
        [Op.or]: [
          { price: 0 },
          { price: null },
          { price: { [Op.lt]: minPrice } }
        ]
      }
    });
    
    console.log(`\n📦 Found ${productsWithZeroPrice.length} products with price ≤ ₹${minPrice}`);
    
    if (productsWithZeroPrice.length === 0) {
      console.log("✅ No products need updating!");
      process.exit(0);
    }
    
    // Show first 10 products that will be updated
    console.log("\n📋 Sample products to be updated:");
    productsWithZeroPrice.slice(0, 10).forEach(p => {
      console.log(`  - ID ${p.id}: "${p.title}" - Current: ₹${p.price || 0} → New: ₹${minPrice}`);
    });
    if (productsWithZeroPrice.length > 10) {
      console.log(`  ... and ${productsWithZeroPrice.length - 10} more`);
    }
    
    // Update all products
    const [updatedCount] = await models.Product.update(
      { price: minPrice },
      {
        where: {
          [Op.or]: [
            { price: 0 },
            { price: null },
            { price: { [Op.lt]: minPrice } }
          ]
        }
      }
    );
    
    console.log(`\n✅ Successfully updated ${updatedCount} products to ₹${minPrice}`);
    console.log(`\n💡 Note: You can edit individual product prices in the admin panel if needed.`);
    
    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err);
    process.exit(1);
  }
}

updateZeroPrices();
