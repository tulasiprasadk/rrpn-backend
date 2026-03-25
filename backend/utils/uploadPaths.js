import fs from "fs";
import path from "path";

function getWritableBaseDir() {
  if (process.env.VERCEL) {
    return path.join("/tmp", "rrpn");
  }

  return path.resolve();
}

export function ensureWritableDir(...segments) {
  const dir = path.join(getWritableBaseDir(), ...segments);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}
