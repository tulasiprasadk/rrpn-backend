import { models } from '../config/database.js';

const { Customer, Address } = models;

async function run() {
  try {
    const email = `e2e_test_${Date.now()}@example.com`;
    console.log('Creating test customer with email:', email);

    let customer = await Customer.create({ email, name: 'E2E Test' });
    console.log('Created customer id:', customer.id);

    const addrPayload = {
      name: 'E2E Tester',
      phone: '9999999999',
      addressLine: '42 Test Lane',
      city: 'Testville',
      state: 'TS',
      pincode: '560000',
      isDefault: true,
      CustomerId: customer.id
    };

    const address = await Address.create(addrPayload);
    console.log('Created address id:', address.id);

    const found = await Address.findAll({ where: { CustomerId: customer.id } });
    console.log('Addresses for customer:', found.map(a => ({ id: a.id, addressLine: a.addressLine, isDefault: a.isDefault })));

    console.log('E2E DB test completed successfully');
    process.exit(0);
  } catch (err) {
    console.error('E2E test failed:', err);
    process.exit(2);
  }
}

run();
