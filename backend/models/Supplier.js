const Supplier = (sequelize, DataTypes) => {
  return sequelize.define('Supplier', {
    name: { type: DataTypes.STRING, allowNull: false },
    businessName: DataTypes.STRING,
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    phone: DataTypes.STRING,
    password: DataTypes.STRING, // hashed password
    otp: DataTypes.STRING,      // temporary OTP for login
    otpExpiry: DataTypes.DATE,  // OTP expiration time
    address: DataTypes.TEXT,
    gstNumber: DataTypes.STRING,
    panNumber: DataTypes.STRING,
    businessLicense: DataTypes.STRING, // file path
    gstCertificate: DataTypes.STRING,  // file path
    idProof: DataTypes.STRING,         // file path
    bankDetails: DataTypes.JSON,       // {accountNumber, ifsc, bankName}
    status: { 
      type: DataTypes.ENUM('pending', 'kyc_pending', 'kyc_submitted', 'approved', 'rejected'), 
      defaultValue: 'pending' 
    },
    kycSubmitted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    kycSubmittedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    rejectionReason: DataTypes.TEXT,
    approvedBy: DataTypes.INTEGER,     // admin ID
    approvedAt: DataTypes.DATE,
    acceptedTnC: { type: DataTypes.BOOLEAN, defaultValue: false },
    metadata: DataTypes.JSON
  });
};

export default Supplier;
