// Dijalankan sebagai proses terpisah oleh helpers/db.ts (lewat tsx), karena
// klien Prisma hasil generate memakai import.meta yang tidak didukung
// transform Playwright. Mencetak satu baris JSON ke stdout.

import path from 'node:path';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../../../src/generated/prisma/client';
import { buatTokenReset } from '../../../src/lib/auth/token-reset';
import { loadEnv } from './env';

loadEnv(path.join(__dirname, '..', '..', '..', '.env'));
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL tidak ada di .env');
const db = new PrismaClient({ adapter: new PrismaMariaDb(process.env.DATABASE_URL) });

async function jalankan(perintah: string | undefined, email: string | undefined, arg?: string): Promise<unknown> {
  if (!email) throw new Error('email wajib');
  if (perintah === 'jumlah-token') return db.passwordResetToken.count({ where: { user: { email } } });
  if (perintah === 'pasang-token') {
    const user = await db.user.findUniqueOrThrow({ where: { email }, select: { id: true } });
    const { token, tokenHash } = buatTokenReset();
    await db.$transaction([
      db.passwordResetToken.deleteMany({ where: { userId: user.id } }),
      db.passwordResetToken.create({ data: { userId: user.id, tokenHash, expiresAt: new Date(Date.now() + Number(arg)) } }),
    ]);
    return token;
  }
  throw new Error(`perintah tidak dikenal: ${perintah}`);
}

jalankan(process.argv[2], process.argv[3], process.argv[4])
  .then((hasil) => process.stdout.write(JSON.stringify(hasil)))
  .finally(() => db.$disconnect());
