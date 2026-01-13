export default (sequelize, DataTypes) => {
  return sequelize.define('Payment', {
    orderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Orders',
        key: 'id'
      }
    },
    amount: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    platformFee: {
      type: DataTypes.FLOAT,
      defaultValue: 0
    },
    deliveryFee: {
      type: DataTypes.FLOAT,
      defaultValue: 0
    },
    commission: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
      comment: 'Platform commission (15% default)'
    },
    supplierAmount: {
      type: DataTypes.FLOAT,
      comment: 'Amount to be paid to supplier after commission'
    },
    paymentMethod: {
      type: DataTypes.ENUM('razorpay', 'upi_qr', 'upi_number'),
      allowNull: false
    },
    paymentStatus: {
      type: DataTypes.ENUM('pending', 'completed', 'failed', 'refunded'),
      defaultValue: 'pending'
    },
    razorpayOrderId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    razorpayPaymentId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    upiTransactionId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    upiQrCode: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Base64 QR code or URL'
    },
    paymentScreenshot: {
      type: DataTypes.STRING,
      allowNull: true
    },
    releasedToSupplier: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    releasedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true
    }
  }, {
    tableName: 'payments',
    timestamps: true
  });
};
