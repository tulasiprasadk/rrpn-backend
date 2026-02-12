const FeaturedAd = (sequelize, DataTypes) => {
  return sequelize.define(
    "FeaturedAd",
    {
      type: { type: DataTypes.STRING, allowNull: false }, // 'mega' | 'scroll'
      imageUrl: { type: DataTypes.STRING, allowNull: false },
      targetUrl: { type: DataTypes.STRING, allowNull: true },
      title: { type: DataTypes.STRING, allowNull: true },
      weight: { type: DataTypes.INTEGER, defaultValue: 1 },
      active: { type: DataTypes.BOOLEAN, defaultValue: true },
      scheduleFrom: { type: DataTypes.DATE, allowNull: true },
      scheduleTo: { type: DataTypes.DATE, allowNull: true },
      meta: { type: DataTypes.JSON, allowNull: true },
    },
    {
      tableName: "FeaturedAds",
      timestamps: true,
    }
  );
};

export default FeaturedAd;
