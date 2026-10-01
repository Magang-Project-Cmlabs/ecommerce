import 'server-only';

import { createHmac } from 'node:crypto';
import { Prisma, type PrismaClient } from '@/generated/prisma/client';
import { kunciDariRahasia } from '@/lib/auth/token';
import type { HasilBatasAuth } from '@/lib/auth/batas-percobaan';
import { prisma } from '@/lib/db';

const JENDELA_MS = 15 * 60 * 1000;
const MAKS = 5;

export function hashKunciBatasAuth(kunci: string): string {
  return createHmac('sha256', kunciDariRahasia(process.env.AUTH_SECRET)).update(`tokokita:auth-rate-limit:${kunci}`).digest('hex');
}

/** UPSERT obtains the row lock even for a new key; competing clients serialize. */
export async function catatBatasAuthDb(kunci: string, client: PrismaClient = prisma, sekarang = new Date()): Promise<HasilBatasAuth> {
  const keyHash = hashKunciBatasAuth(kunci);
  const expiresAt = new Date(sekarang.getTime() + JENDELA_MS);
  const { hasil, bersihkan } = await client.$transaction(async tx => {
    await tx.$executeRaw`INSERT INTO auth_rate_limits (key_hash, attempts, expires_at)
      VALUES (${keyHash}, 0, ${expiresAt}) ON DUPLICATE KEY UPDATE key_hash = key_hash`;
    const catatan = await tx.authRateLimit.findUniqueOrThrow({ where: { keyHash } });
    const kedaluwarsa = catatan.expiresAt <= sekarang;
    if (!kedaluwarsa && catatan.attempts >= MAKS) {
      return { hasil: { boleh: false, tungguDetik: Math.max(1, Math.ceil((catatan.expiresAt.getTime() - sekarang.getTime()) / 1000)) } as HasilBatasAuth, bersihkan: false };
    }
    await tx.authRateLimit.update({ where: { keyHash }, data: kedaluwarsa ? { attempts: 1, expiresAt } : { attempts: { increment: 1 } } });
    return { hasil: { boleh: true } as HasilBatasAuth, bersihkan: kedaluwarsa || catatan.attempts === 0 };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted, maxWait: 10000, timeout: 10000 });
  if (bersihkan) {
    // Outside the transaction to avoid taking unrelated locks while holding
    // this key. Retain one day and delete at most 100 old rows per new window.
    try {
      const ambang = new Date(sekarang.getTime() - 24 * 60 * 60 * 1000);
      await client.$executeRaw`DELETE FROM auth_rate_limits WHERE expires_at < ${ambang} ORDER BY expires_at LIMIT 100`;
    } catch { console.error('[rate limit] pembersihan catatan lama belum tersedia'); }
  }
  return hasil;
}

export async function hapusBatasAuthDb(kunci: string, client: PrismaClient = prisma): Promise<void> {
  await client.authRateLimit.deleteMany({ where: { keyHash: hashKunciBatasAuth(kunci) } });
}
