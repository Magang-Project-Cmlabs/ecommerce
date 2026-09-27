// Akses data token reset password (PRD §9 password_reset_tokens, §10.9).
// Yang disimpan hanya hash token; token asli hanya ada di email pengguna.

import 'server-only';
import { prisma } from '@/lib/db';

/** Jeda minimum antar email reset untuk akun yang sama (cegah banjir email dari banyak IP). */
const JEDA_EMAIL_MS = 60 * 1000;

export function cariAkunUntukReset(email: string) {
  return prisma.user.findFirst({
    where: { email, deletedAt: null },
    select: { id: true, name: true, email: true },
  });
}

/**
 * Simpan token baru dan buang token lama milik akun itu (hanya link terbaru
 * yang berlaku). Mengembalikan false tanpa menyimpan bila akun baru saja
 * meminta reset kurang dari semenit lalu.
 */
export async function simpanTokenReset(userId: number, tokenHash: string, expiresAt: Date): Promise<boolean> {
  const terakhir = await prisma.passwordResetToken.findFirst({
    where: { userId, createdAt: { gt: new Date(Date.now() - JEDA_EMAIL_MS) } },
    select: { id: true },
  });
  if (terakhir) return false;
  await prisma.$transaction([
    prisma.passwordResetToken.deleteMany({ where: { userId } }),
    prisma.passwordResetToken.create({ data: { userId, tokenHash, expiresAt } }),
  ]);
  return true;
}

/** True bila token belum dipakai, belum kedaluwarsa, dan akunnya masih ada. */
export async function tokenResetMasihBerlaku(tokenHash: string): Promise<boolean> {
  const token = await prisma.passwordResetToken.findFirst({
    where: { tokenHash, usedAt: null, expiresAt: { gt: new Date() }, user: { deletedAt: null } },
    select: { id: true },
  });
  return token !== null;
}

/**
 * Pakai token sekali: tandai terpakai secara bersyarat (dua permintaan
 * bersamaan tidak bisa sama-sama berhasil), ganti password, lalu matikan token
 * lain milik akun itu — semua dalam satu transaksi. Null bila token tidak
 * berlaku lagi.
 */
export function pakaiTokenReset(tokenHash: string, passwordHash: string): Promise<{ userId: number } | null> {
  return prisma.$transaction(async (tx) => {
    const sekarang = new Date();
    const token = await tx.passwordResetToken.findUnique({ where: { tokenHash }, select: { id: true, userId: true } });
    if (!token) return null;

    const dipakai = await tx.passwordResetToken.updateMany({
      where: { id: token.id, usedAt: null, expiresAt: { gt: sekarang } },
      data: { usedAt: sekarang },
    });
    if (dipakai.count !== 1) return null;

    const diganti = await tx.user.updateMany({ where: { id: token.userId, deletedAt: null }, data: { passwordHash } });
    if (diganti.count !== 1) return null; // akun dihapus setelah link dikirim

    await tx.passwordResetToken.updateMany({ where: { userId: token.userId, usedAt: null }, data: { usedAt: sekarang } });
    return { userId: token.userId };
  });
}
