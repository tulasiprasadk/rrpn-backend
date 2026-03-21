const Order = (sequelize, DataTypes) => {
  const OrderModel = sequelize.define("Order", {
    // Customer Info (for guest orders)
    customerName: DataTypes.STRING,
    customerPhone: DataTypes.STRING,
    customerAddress: DataTypes.TEXT,
    
    // Foreign Keys
    CustomerId: {
      type: DataTypes.INTEGER,
      allowNull: true, // null for guest orders
      references: {
        model: 'customers',
        key: 'id'
      }
    },
    productId: {
      type: DataTypes.INTEGER,
      allowNull: true, // Allow null for service orders (services use string IDs)
      references: {
        model: 'Products',
        key: 'id'
      }
    },
    supplierId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Suppliers',
        key: 'id'
      }
    },
    addressId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Addresses',
        key: 'id'
      }
    },
    
    // Order Details
    qty: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    type: {
      type: DataTypes.ENUM("delivery", "visit"),
      allowNull: true
    },
    totalAmount: DataTypes.FLOAT,
    platformFee: DataTypes.FLOAT,
    status: {
      type: DataTypes.ENUM(
        "created",
        "paid",
        "delivered",
        "cancelled",
        "payment_failed"
      ),
      defaultValue: "created",
    },
    
    // Payment Info
    paymentInfo: DataTypes.JSON,
    paymentScreenshot: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    paymentUNR: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    paymentStatus: {
      type: DataTypes.STRING, // pending / approved / rejected
      defaultValue: "pending",
    }
  });
  return OrderModel;
};

export default Order;
