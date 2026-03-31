const http = require('http');
const httpProxy = require('http-proxy');

const proxy = httpProxy.createProxyServer({});

const server = http.createServer((req, res) => {
  // handle CORS preflight quickly
  if (req.method === 'OPTIONS') {
    const origin = req.headers.origin || '*';
    res.writeHead(204, {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      'Access-Control-Max-Age': '86400',
      'Access-Control-Allow-Credentials': 'true'
    });
    return res.end();
  }

  // proxy all requests to backend on port 4000
  proxy.web(req, res, { target: 'http://localhost:4000' }, (err) => {
    res.statusCode = 502;
    res.end('Bad Gateway: ' + err.message);
  });
});

proxy.on('proxyRes', (proxyRes, req, res) => {
  try {
    const origin = req.headers.origin || '*';
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  } catch (e) {}
});

server.on('error', (e) => console.error('Proxy server error', e));
server.listen(3000, () => console.log('Proxy listening on 3000 -> http://localhost:4000'));
