const Notification = (sequelize, DataTypes) => {
  return sequelize.define("Notification", {
    audience: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "admin"
    },
    customerId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    type: {
      type: DataTypes.STRING, // e.g., "order_created", "payment_submitted"
      allowNull: false
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    meta: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  });
};

export default Notification;
