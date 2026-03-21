const http = require('http');
const data = JSON.stringify({ email: 'admin@rrnagar.com', password: 'devpass123' });

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/admin/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};

const req = http.request(options, (res) => {
  let body = '';
  res.setEncoding('utf8');
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log('STATUS', res.statusCode);
    try {
      console.log(JSON.stringify(JSON.parse(body), null, 2));
    } catch (e) {
      console.log('RESPONSE:', body);
    }
  });
});

req.on('error', (e) => console.error('ERR', e));
req.write(data);
req.end();
