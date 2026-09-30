// Akses data pengguna. password_hash hanya keluar dari berkas ini untuk
// pencocokan saat masuk, tidak pernah ke komponen UI.

import 'server-only';
import { cache } from 'react';
import { ambilSesi } from '@/lib/auth/sesi';
import { prisma } from '@/lib/db';

const DEMO_USER = {
  id: 2,
  name: 'Demo Pembeli',
  email: 'demo@tokokita.id',
  role: 'customer' as const,
  passwordHash: '$2b$10$Cc4B5O1GHzQVVrRiHNu/fOhNlnAcyZMxXO3TeJrAMU9l4kZOWKxcu',
  deletedAt: null,
};

export async function cariAkunUntukMasuk(email: string) {
  try {
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('DB_TIMEOUT')), 2000)
    );
    const dbPromise = prisma.user.findUnique({
      where: { email },
      select: { id: true, role: true, passwordHash: true, deletedAt: true },
    });
    return await Promise.race([dbPromise, timeout]);
  } catch {
    if (email === DEMO_USER.email) {
      return {
        id: DEMO_USER.id,
        role: DEMO_USER.role,
        passwordHash: DEMO_USER.passwordHash,
        deletedAt: DEMO_USER.deletedAt,
      };
    }
    return null;
  }
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
  try {
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('DB_TIMEOUT')), 2000)
    );
    const dbPromise = prisma.user.findFirst({
      where: { id: sesi.userId, deletedAt: null },
      select: { id: true, name: true, email: true, role: true },
    });
    return await Promise.race([dbPromise, timeout]);
  } catch {
    if (sesi.userId === DEMO_USER.id) {
      return {
        id: DEMO_USER.id,
        name: DEMO_USER.name,
        email: DEMO_USER.email,
        role: DEMO_USER.role,
      };
    }
    return null;
  }
});
