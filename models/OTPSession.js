export default (sequelize, DataTypes) => {
  return sequelize.define('OTPSession', {
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Phone number for OTP'
    },
    otp: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: '6-digit OTP code'
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: 'OTP expiration time (5 minutes)'
    },
    attempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Number of verification attempts'
    },
    maxAttempts: {
      type: DataTypes.INTEGER,
      defaultValue: 3
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    verifiedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    sessionToken: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Session token after successful verification'
    }
  }, {
    tableName: 'otp_sessions',
    timestamps: true,
    indexes: [
      {
        fields: ['phone', 'isVerified']
      },
      {
        fields: ['sessionToken']
      }
    ]
  });
};
