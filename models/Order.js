const Order = (sequelize, DataTypes) => {
  const OrderModel = sequelize.define("Order", {
    customerName: DataTypes.STRING,
    customerPhone: DataTypes.STRING,
    customerAddress: DataTypes.TEXT,
    addressId: {
      type: DataTypes.INTEGER,
      allowNull: true
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
