const fs = require('fs');
const p = 'backend/products_snapshot.json';
if (!fs.existsSync(p)) { console.log('NO FILE'); process.exit(2); }
const s = fs.readFileSync(p, 'utf8');
try {
  const a = JSON.parse(s);
  console.log('COUNT:', Array.isArray(a) ? a.length : Object.keys(a).length);
  const sample = Array.isArray(a) ? a[0] : a[Object.keys(a)[0]];
  console.log('SAMPLE:', JSON.stringify(sample, null, 2));
} catch (e) {
  console.error('PARSE_ERR', e.message);
  process.exit(3);
}
