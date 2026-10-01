import 'server-only';
import { cache } from 'react';
import { ambilSesi } from '@/lib/auth/sesi';
import { prisma } from '@/lib/db';
import { versiSesiSah } from '@/lib/auth/password-version';
export function cariAkunUntukMasuk(email: string) {
  return prisma.user.findUnique({ where: { email }, select: { id: true, role: true, passwordHash: true, deletedAt: true } });
}
export function buatAkunPembeli(data: { name: string; email: string; phone: string | null; passwordHash: string }) {
  return prisma.user.create({ data: { ...data, role: 'customer' }, select: { id: true, role: true } });
}
export const ambilPenggunaSaatIni = cache(async () => {
  const sesi = await ambilSesi();
  if (!sesi) return null;
  const user = await prisma.user.findFirst({ where: { id: sesi.userId, deletedAt: null }, select: { id: true, name: true, email: true, role: true, passwordHash: true } });
  if (!user || !versiSesiSah(sesi.passwordVersion, user.passwordHash)) return null;
  return { id: user.id, name: user.name, email: user.email, role: user.role };
});
export function ambilProfilPengguna(id: number) {
  return prisma.user.findFirst({ where: { id, deletedAt: null }, select: { id: true, name: true, email: true, phone: true, createdAt: true, role: true } });
}
export function ambilHashPassword(id: number) {
  return prisma.user.findFirst({ where: { id, deletedAt: null }, select: { passwordHash: true } });
}
