export default (sequelize, DataTypes) => {
  return sequelize.define('AdClick', {
    adId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Ads',
        key: 'id'
      }
    },
    visitorId: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Anonymous visitor identifier'
    },
    customerId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'customers',
        key: 'id'
      }
    },
    ipAddress: {
      type: DataTypes.STRING,
      allowNull: true
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    clickedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    redirectUrl: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'URL where user was redirected'
    }
  }, {
    tableName: 'ad_clicks',
    timestamps: true
  });
};
