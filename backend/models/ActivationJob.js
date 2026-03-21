const ActivationJob = (sequelize, DataTypes) => {
  return sequelize.define(
    "ActivationJob",
    {
      ProductId: { type: DataTypes.INTEGER, allowNull: false },
      status: { type: DataTypes.STRING, allowNull: false, defaultValue: "pending" },
      attempts: { type: DataTypes.INTEGER, defaultValue: 0 },
      lastError: { type: DataTypes.TEXT, allowNull: true },
      createdBy: { type: DataTypes.INTEGER, allowNull: true },
    },
    {
      tableName: "ActivationJobs",
      timestamps: true,
    }
  );
};

export default ActivationJob;
