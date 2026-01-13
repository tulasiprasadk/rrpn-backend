export default (sequelize, DataTypes) => {
  return sequelize.define('PlatformConfig', {
    key: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      primaryKey: true
    },
    value: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'JSON string or plain text value'
    },
    type: {
      type: DataTypes.ENUM('string', 'number', 'boolean', 'json'),
      defaultValue: 'string'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    category: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Config category: payment, fees, delivery, etc.'
    }
  }, {
    tableName: 'platform_config',
    timestamps: true
  });
};
