const ProductView = (sequelize, DataTypes) => {
  return sequelize.define(
    "ProductView",
    {
      ProductId: { type: DataTypes.INTEGER, allowNull: false },
      views: { type: DataTypes.INTEGER, defaultValue: 0 },
      lastViewAt: { type: DataTypes.DATE, allowNull: true },
    },
    {
      tableName: "ProductViews",
      timestamps: false,
    }
  );
};

export default ProductView;
