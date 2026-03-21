import { initDatabase, models } from '../config/database.js';

async function main(){
  try{
    await initDatabase();
    const Product = models && models.Product;
    if(!Product){
      console.error('Product model not available');
      process.exit(1);
    }
    const count = await Product.count();
    console.log('products_count:', count);
    if(count>0){
      const sample = await Product.findAll({ limit: 3 });
      console.log('sample:', JSON.stringify(sample.map(p=>({ id: p.id, title: p.title, price: p.price })), null, 2));
    }
    process.exit(0);
  }catch(err){
    console.error('ERROR:', err && err.message? err.message: err);
    if(err && err.stack) console.error(err.stack);
    process.exit(1);
  }
}

main();
import "dotenv/config";
import { sequelize, models } from "../config/database.js";

async function run() {
  try {
    await sequelize.authenticate();
    console.log('DB connected for count check');
    const { Product } = models || {};
    if (!Product) {
      console.log('No Product model available');
      process.exit(0);
    }
    const count = await Product.count();
    console.log('product_count:', count);
    const sample = await Product.findAll({ limit: 5, order: [['id','DESC']] });
    console.log('sample:', sample.map(r => (r.toJSON ? r.toJSON() : r)));
    process.exit(0);
  } catch (err) {
    console.error('Count script error:', err.message || err);
    process.exit(1);
  }
}

run();

