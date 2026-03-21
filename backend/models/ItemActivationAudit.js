const ItemActivationAudit = (sequelize, DataTypes) => {
  return sequelize.define(
    "ItemActivationAudit",
    {
      ProductId: { type: DataTypes.INTEGER, allowNull: false },
      action: { type: DataTypes.STRING, allowNull: false },
      userId: { type: DataTypes.INTEGER, allowNull: true },
      note: { type: DataTypes.TEXT, allowNull: true },
    },
    {
      tableName: "ItemActivationAudits",
      timestamps: true,
    }
  );
};

export default ItemActivationAudit;
