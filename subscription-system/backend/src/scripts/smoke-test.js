// Simple smoke test that calls the subscription create endpoint
const http = require('http');

const payload = JSON.stringify({
  user_id: 999,
  category: 'flowers',
  plan_type: 'Starter',
  frequency: 1,
  delivery_days: [1],
  items: [{ id: 'test-rose', price: 12, qty: 1 }],
  quantities: { 'test-rose': 1 }
});

const options = {
  hostname: 'localhost',
  port: 4000,
  path: '/subscription/create',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    try { console.log('Response:', JSON.parse(data)); } catch(e) { console.log(data); }
  });
});

req.on('error', (e) => { console.error('Error:', e.message); });
req.write(payload);
req.end();
