import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

const dir = path.resolve('./routes');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));

(async () => {
  for (const file of files) {
    const full = path.join(dir, file);
    const url = pathToFileURL(full).href;
    try {
      console.log('Importing', full);
      await import(url);
      console.log('OK:', file);
    } catch (err) {
      console.error('ERROR importing', file, err && err.message);
      if (err && err.stack) console.error(err.stack);
    }
  }
})();
