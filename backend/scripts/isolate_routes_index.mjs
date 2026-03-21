import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

const src = path.resolve('./routes/index.js');
const text = fs.readFileSync(src, 'utf8');
const lines = text.split(/\r?\n/);

// collect import lines at top
const importLines = [];
for (const line of lines) {
  if (/^\s*import\s+/.test(line)) importLines.push(line);
  else if (line.trim().startsWith('//')) continue;
  else if (line.trim() === '') continue;
  else break;
}

console.log('Found', importLines.length, 'top imports.');

for (let i = 1; i <= importLines.length; i++) {
  const subset = importLines.slice(0, i).join('\n');
  const tmpPath = path.resolve(`./routes/_tmp_index_${i}.mjs`);
  const content = `${subset}\n\nexport default true;\n`;
  fs.writeFileSync(tmpPath, content);
  try {
    console.log('---\nTrying import with', i, 'imports');
    await import(pathToFileURL(tmpPath).href);
    console.log('SUCCESS for', i);
  } catch (err) {
    console.error('FAIL for', i, err && err.message);
    if (err && err.stack) console.error(err.stack.split('\n').slice(0,10).join('\n'));
    break;
  } finally {
    try { fs.unlinkSync(tmpPath); } catch(e){}
  }
}
