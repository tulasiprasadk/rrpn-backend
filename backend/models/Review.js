export default (sequelize, DataTypes) => {
  return sequelize.define('Review', {
    orderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Orders',
        key: 'id'
      }
    },
    customerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'customers',
        key: 'id'
      }
    },
    productId: {
      type: DataTypes.INTEGER,
      allowNull: true,
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
    productRating: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 5
      },
      comment: 'Rating for product/service (1-5 stars)'
    },
    platformRating: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 5
      },
      comment: 'Rating for platform experience (1-5 stars)'
    },
    productReview: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Review text for product/service'
    },
    platformReview: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Review text for platform'
    },
    isApproved: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'reviews',
    timestamps: true
  });
};
