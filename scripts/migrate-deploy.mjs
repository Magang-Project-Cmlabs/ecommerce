// Adapter runtime membaca CA dari env; engine Prisma Migrate memerlukan file.
// Wrapper ini memakai CA yang sama dan sslaccept=strict, tanpa mencetak URL.
import { existsSync } from 'node:fs';
import { mkdtemp, writeFile, unlink, rmdir } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
if (existsSync('.env')) process.loadEnvFile('.env');
let directory;
let certificate;
try {
  const env = { ...process.env };
  const ca = env.DATABASE_CA_CERT?.trim().replaceAll('\\n', '\n');
  if (ca) {
    if (!ca.includes('-----BEGIN CERTIFICATE-----')) throw new Error('DATABASE_CA_CERT harus PEM.');
    directory = await mkdtemp(path.join(os.tmpdir(), 'tokokita-migrate-'));
    certificate = path.join(directory, 'ca.pem');
    await writeFile(certificate, ca, { mode: 0o600 });
    let url;
    try { url = new URL(env.DATABASE_URL); } catch { throw new Error('DATABASE_URL tidak sah.'); }
    url.searchParams.set('sslcert', certificate.replaceAll('\\', '/'));
    url.searchParams.set('sslaccept', 'strict');
    url.searchParams.set('connect_timeout', '10');
    env.DATABASE_URL = url.toString();
  }
  const child = spawn(process.execPath, ['node_modules/prisma/build/index.js', 'migrate', 'deploy'], { env, stdio: 'inherit' });
  process.exitCode = await new Promise((resolve, reject) => { child.once('error', reject); child.once('exit', code => resolve(code ?? 1)); });
} finally {
  if (certificate) await unlink(certificate);
  if (directory) await rmdir(directory);
}
