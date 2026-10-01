import { cp, access } from 'node:fs/promises';
import path from 'node:path';
const root = process.cwd();
await access(path.join(root, '.next/standalone/server.js'));
await Promise.all([
  cp(path.join(root, 'public'), path.join(root, '.next/standalone/public'), { recursive: true }),
  cp(path.join(root, '.next/static'), path.join(root, '.next/standalone/.next/static'), { recursive: true }),
]);
console.log('Aset public dan Next static siap untuk server standalone.');
