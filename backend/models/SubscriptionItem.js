const SubscriptionItem = (sequelize, DataTypes) => {
  return sequelize.define("SubscriptionItem", {
    itemType: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "product"
    },
    productId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    unitPrice: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0
    },
    lineTotal: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true
    }
  });
};

export default SubscriptionItem;
