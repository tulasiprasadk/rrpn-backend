import 'dotenv/config';
import { models, sequelize } from '../config/database.js';

const { Supplier, Notification } = models;

async function run() {
  try {
    await sequelize.sync();

    const email = 'test.supplier@example.com';

    // Remove existing test supplier if any
    await Supplier.destroy({ where: { email } });

    const supplier = await Supplier.create({
      name: 'Test Supplier',
      businessName: 'Test Business',
      email,
      phone: '9000000000',
      address: 'Test address',
      gstNumber: 'GST12345',
      panNumber: 'PAN12345',
      kycSubmitted: true,
      kycSubmittedAt: new Date(),
      status: 'kyc_submitted',
      acceptedTnC: true
    });

    const message = `Supplier: ${supplier.name} (${supplier.email})\nBusiness: ${supplier.businessName}\nPhone: ${supplier.phone}\nGST: ${supplier.gstNumber}\nPAN: ${supplier.panNumber}\n\nPlease review and approve in Admin Dashboard.`;

    const note = await Notification.create({
      audience: 'admin',
      type: 'supplier_registration',
      title: 'New Supplier KYC Submission',
      message
    });

    console.log('Created supplier id=', supplier.id);
    console.log('Created notification id=', note.id);
    process.exit(0);
  } catch (err) {
    console.error('Simulation error:', err);
    process.exit(1);
  }
}

run();