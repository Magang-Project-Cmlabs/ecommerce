// Akses data pengguna. password_hash hanya keluar dari berkas ini untuk
// pencocokan saat masuk, tidak pernah ke komponen UI.

import 'server-only';
import { cache } from 'react';
import { ambilSesi } from '@/lib/auth/sesi';
import { prisma } from '@/lib/db';

export function cariAkunUntukMasuk(email: string) {
  return prisma.user.findUnique({
    where: { email },
    select: { id: true, role: true, passwordHash: true, deletedAt: true },
  });
}

export function buatAkunPembeli(data: { name: string; email: string; phone: string | null; passwordHash: string }) {
  return prisma.user.create({
    data: { ...data, role: 'customer' },
    select: { id: true, role: true },
  });
}

/**
 * Pengguna yang sedang masuk, atau null. Sesi dari akun yang sudah dihapus
 * (dianonimkan, PRD §10.9) dianggap tidak ada. Di-cache per request.
 */
export const ambilPenggunaSaatIni = cache(async () => {
  const sesi = await ambilSesi();
  if (!sesi) return null;
  return prisma.user.findFirst({
    where: { id: sesi.userId, deletedAt: null },
    select: { id: true, name: true, email: true, role: true },
  });
});
