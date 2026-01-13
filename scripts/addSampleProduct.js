// scripts/addSampleProduct.js
// Adds a sample approved product to Groceries (categoryId=2)

const { Product, sequelize } = require('../rrw-backend/models');

async function addSampleProduct() {
  try {
    await sequelize.sync();
    const product = await Product.create({
      title: 'Sample Grocery Product',
      description: 'A test grocery item.',
      price: 99,
      unit: 'kg',
      CategoryId: 2, // Groceries
      status: 'approved'
    });
    console.log('✅ Added product:', product.title);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error adding product:', err);
    process.exit(1);
  }
}

addSampleProduct();
