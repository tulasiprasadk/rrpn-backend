// scripts/approveAllProducts.js
// Approves all products in the database (sets status to 'approved')

const { Product, sequelize } = require('../rrw-backend/models');

async function approveAllProducts() {
  try {
    await sequelize.sync();
    const [updated] = await Product.update(
      { status: 'approved' },
      { where: {} }
    );
    console.log(`✅ Approved ${updated} products.`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error approving products:', err);
    process.exit(1);
  }
}

approveAllProducts();
