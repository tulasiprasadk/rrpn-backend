import sequelize from '../config/database.js';
import { DataTypes } from 'sequelize';
import getAdmin from './Admin.js';
import getAd from './Ad.js';
import getSupplier from './Supplier.js';
import getCategory from './Category.js';
import getProduct from './Product.js';
import getOrder from './Order.js';
import getAnalyticsVisit from './AnalyticsVisit.js';
import getStockHistory from './StockHistory.js';
import getShop from './Shop.js';
import getCustomer from './Customer.js';
import getCartItem from './CartItem.js';
import getAddress from './Address.js';
import getNotification from './Notification.js';
import getVariety from './Variety.js';

// Load Models
<<<<<<< HEAD
const Admin = require('./Admin')(sequelize, DataTypes);
const Ad = require('./Ad')(sequelize, DataTypes);
const Supplier = require('./Supplier')(sequelize, DataTypes);
const Category = require('./Category')(sequelize, DataTypes);
const Product = require('./Product')(sequelize, DataTypes);
const Order = require('./Order')(sequelize, DataTypes);
const AnalyticsVisit = require('./AnalyticsVisit')(sequelize, DataTypes);
const StockHistory = require('./StockHistory')(sequelize, DataTypes);
const Shop = require('./Shop')(sequelize, DataTypes);
const Customer = require('./Customer')(sequelize, DataTypes);
const CartItem = require('./CartItem')(sequelize, DataTypes);
const Address = require('./Address')(sequelize, DataTypes);   // ✅ ADDED
const Notification = require("./Notification")(sequelize, DataTypes);
const Variety = require('./Variety')(sequelize, DataTypes);
=======
const Admin = getAdmin(sequelize, DataTypes);
const Ad = getAd(sequelize, DataTypes);
const Supplier = getSupplier(sequelize, DataTypes);
const Category = getCategory(sequelize, DataTypes);
const Product = getProduct(sequelize, DataTypes);
const Order = getOrder(sequelize, DataTypes);
const AnalyticsVisit = getAnalyticsVisit(sequelize, DataTypes);
const StockHistory = getStockHistory(sequelize, DataTypes);
const Shop = getShop(sequelize, DataTypes);
const Customer = getCustomer(sequelize, DataTypes);
const CartItem = getCartItem(sequelize, DataTypes);
const Address = getAddress(sequelize, DataTypes);
const Notification = getNotification(sequelize, DataTypes);
const Variety = getVariety(sequelize, DataTypes);
>>>>>>> 6ad866bc3b02abfaafe4c4d9ece89858474b19cd
// CartItem associations
Customer.hasMany(CartItem, { foreignKey: 'customerId', onDelete: 'CASCADE' });
CartItem.belongsTo(Customer, { foreignKey: 'customerId' });
Product.hasMany(CartItem, { foreignKey: 'productId', onDelete: 'CASCADE' });
CartItem.belongsTo(Product, { foreignKey: 'productId' });

// Junction table for many-to-many Product-Supplier relationship
const ProductSupplier = sequelize.define('ProductSupplier', {
  price: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  stock: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  timestamps: true
});

/* ===========================
   MODEL RELATIONS
=========================== */

// Many-to-Many: Product ↔ Supplier (through ProductSupplier)
Product.belongsToMany(Supplier, { through: ProductSupplier, as: 'suppliers' });
Supplier.belongsToMany(Product, { through: ProductSupplier, as: 'products' });

// Category → Products
Category.hasMany(Product);
Product.belongsTo(Category);

// Category → Varieties
Category.hasMany(Variety);
Variety.belongsTo(Category);

// Supplier → Orders
Supplier.hasMany(Order);
Order.belongsTo(Supplier);

// Product → Orders
Product.hasMany(Order);
Order.belongsTo(Product);

// Product → Stock History
Product.hasMany(StockHistory);
StockHistory.belongsTo(Product);

// Customer → Orders
Customer.hasMany(Order);              // ✅ ADDED
Order.belongsTo(Customer);            // ✅ ADDED

// Address → Orders (using existing addressId column)
Address.hasMany(Order, { foreignKey: 'addressId', onDelete: 'SET NULL', onUpdate: 'CASCADE' });
Order.belongsTo(Address, { foreignKey: 'addressId', onDelete: 'SET NULL', onUpdate: 'CASCADE' });

// Customer → Addresses
Customer.hasMany(Address);            // ✅ ADDED
Address.belongsTo(Customer);          // ✅ ADDED

/* ===========================
   EXPORT MODELS + SEQUELIZE
=========================== */
export {
  sequelize,
  Admin,
  Ad,
  Supplier,
  Category,
  Product,
  Order,
  AnalyticsVisit,
  StockHistory,
  Shop,
  Customer,
  CartItem,
<<<<<<< HEAD
  Address,                             // ✅ ADDED
=======
  Address,
>>>>>>> 6ad866bc3b02abfaafe4c4d9ece89858474b19cd
  Notification,
  Variety,
  ProductSupplier
};
