import http from 'http';

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/admin/suppliers',
  method: 'GET',
  headers: {
    'Authorization': 'Bearer admin_1_1770736620307',
    'Accept': 'application/json'
  }
};

const req = http.request(options, (res) => {
  console.log('STATUS:', res.statusCode);
  console.log('HEADERS:', res.headers);
  let body = '';
  res.setEncoding('utf8');
  res.on('data', (chunk) => { body += chunk; });
  res.on('end', () => {
    console.log('BODY:', body);
    process.exit(0);
  });
});

req.on('error', (e) => {
  console.error('REQUEST ERROR:', e);
  process.exit(2);
});

req.end();
