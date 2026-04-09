const Subscription = (sequelize, DataTypes) => {
  return sequelize.define("Subscription", {
    category: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "general"
    },
    duration: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "monthly"
    },
    period: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "monthly"
    },
    frequency: {
      type: DataTypes.STRING,
      allowNull: true
    },
    planType: {
      type: DataTypes.STRING,
      allowNull: true
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "draft"
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    price: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    savings: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0
    },
    pricingDetails: {
      type: DataTypes.JSON,
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true
    },
    activationMode: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "payment_approval"
    },
    orderId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    autoRenew: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    pausedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    pauseReason: {
      type: DataTypes.STRING,
      allowNull: true
    }
  });
};

export default Subscription;
