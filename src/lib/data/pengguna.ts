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
/** Ganti hash lama (mis. bcrypt) ke hash baru hanya bila belum berubah sejak dibaca. true bila terganti. */
export async function gantiHashLama(id: number, hashLama: string, hashBaru: string) {
  const hasil = await prisma.user.updateMany({ where: { id, passwordHash: hashLama, deletedAt: null }, data: { passwordHash: hashBaru } });
  return hasil.count === 1;
}

export type HasilAkunGoogle =
  | { ok: true; akun: { id: number; role: 'customer' | 'admin'; passwordHash: string } }
  | { ok: false; alasan: 'admin' | 'dihapus' | 'tertaut-lain' };

/**
 * Login Google (D21): cari akun lewat ID Google, lalu lewat email yang sudah diverifikasi
 * Google (ditautkan), atau buat akun pembeli baru. Akun admin tidak boleh masuk lewat
 * Google; akun yang dihapus ditolak; email yang sudah tertaut ke akun Google lain ditolak.
 *
 * Saat menautkan akun lama, password lama diganti hash acak di update yang sama: pendaftaran
 * password tidak memverifikasi email, jadi akun itu bisa saja dibuat orang lain dengan email
 * korban (pra-pembajakan). Password dan sesi lamanya langsung tidak berlaku; pemilik asli bisa
 * mengatur password lewat Lupa password. `buatHashAcak` hanya dipanggil bila perlu (Argon2 mahal).
 */
export async function masukAtauDaftarGoogle(profil: { sub: string; email: string; name: string }, buatHashAcak: () => Promise<string>, ulang = true): Promise<HasilAkunGoogle> {
  const pilih = { id: true, role: true, passwordHash: true, deletedAt: true, googleSub: true } as const;
  const periksa = (u: { id: number; role: 'customer' | 'admin'; passwordHash: string; deletedAt: Date | null }): HasilAkunGoogle =>
    u.deletedAt ? { ok: false, alasan: 'dihapus' } : u.role === 'admin' ? { ok: false, alasan: 'admin' }
      : { ok: true, akun: { id: u.id, role: u.role, passwordHash: u.passwordHash } };

  const olehSub = await prisma.user.findUnique({ where: { googleSub: profil.sub }, select: pilih });
  if (olehSub) return periksa(olehSub);

  const olehEmail = await prisma.user.findUnique({ where: { email: profil.email }, select: pilih });
  if (olehEmail) {
    const hasil = periksa(olehEmail);
    if (!hasil.ok) return hasil;
    if (olehEmail.googleSub && olehEmail.googleSub !== profil.sub) return { ok: false, alasan: 'tertaut-lain' };
    const hashBaru = await buatHashAcak();
    const tertaut = await prisma.user.updateMany({
      where: { id: olehEmail.id, googleSub: null, deletedAt: null, role: 'customer' },
      data: { googleSub: profil.sub, passwordHash: hashBaru },
    });
    if (tertaut.count !== 1) return ulang ? masukAtauDaftarGoogle(profil, buatHashAcak, false) : { ok: false, alasan: 'tertaut-lain' };
    return { ok: true, akun: { ...hasil.akun, passwordHash: hashBaru } };
  }

  try {
    const baru = await prisma.user.create({
      data: { name: profil.name, email: profil.email, phone: null, passwordHash: await buatHashAcak(), googleSub: profil.sub, role: 'customer' },
      select: { id: true, role: true, passwordHash: true },
    });
    return { ok: true, akun: baru };
  } catch (error) {
    // Dua callback bersamaan untuk orang yang sama: baris unik sudah dibuat, baca ulang sekali.
    if (ulang && (error as { code?: string })?.code === 'P2002') return masukAtauDaftarGoogle(profil, buatHashAcak, false);
    throw error;
  }
}
