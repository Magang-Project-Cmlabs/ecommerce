// Login Google (D21) dengan MySQL sungguhan: penautan email, akun baru, penolakan admin/dihapus.
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { prisma } from '@/lib/db';
import { masukAtauDaftarGoogle } from '@/lib/data/pengguna';

const stamp = Date.now();
const email = (n: string) => `google-${n}-${stamp}@example.test`;
const dibuat: number[] = [];
const hash = (nilai: string) => vi.fn(async () => nilai);

beforeAll(async () => {
  const database = new URL(process.env.DATABASE_URL!).pathname;
  if (!database.includes('verifikasi') && !database.endsWith('_test')) throw new Error('Google integration requires isolated database');
  for (const [nama, role] of [['lama', 'customer'], ['admin', 'admin'], ['hapus', 'customer']] as const) {
    const u = await prisma.user.create({ data: { name: `Uji ${nama}`, email: email(nama), passwordHash: 'hash-lama-uji', role, ...(nama === 'hapus' ? { deletedAt: new Date() } : {}) } });
    dibuat.push(u.id);
  }
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { OR: [{ id: { in: dibuat } }, { email: { startsWith: 'google-', endsWith: `-${stamp}@example.test` } }] } });
  await prisma.$disconnect();
});

describe('masukAtauDaftarGoogle', () => {
  it('menautkan akun lama dan mengganti password lama (cegah pembajakan akun yang didaftarkan orang lain)', async () => {
    const acak = hash('hash-acak-taut');
    const pertama = await masukAtauDaftarGoogle({ sub: `sub-lama-${stamp}`, email: email('lama'), name: 'Nama Google' }, acak);
    expect(pertama).toMatchObject({ ok: true, akun: { id: dibuat[0], role: 'customer', passwordHash: 'hash-acak-taut' } });
    const akun = await prisma.user.findUniqueOrThrow({ where: { id: dibuat[0] } });
    expect(akun).toMatchObject({ googleSub: `sub-lama-${stamp}`, passwordHash: 'hash-acak-taut', name: 'Uji lama' });
    expect(acak).toHaveBeenCalledTimes(1);
    // Login berikutnya lewat ID Google tidak mengubah password lagi dan tidak menghitung hash.
    const lagi = hash('tidak-dipakai');
    expect(await masukAtauDaftarGoogle({ sub: `sub-lama-${stamp}`, email: 'email-berubah@example.test', name: 'X' }, lagi))
      .toMatchObject({ ok: true, akun: { id: dibuat[0], passwordHash: 'hash-acak-taut' } });
    expect(lagi).not.toHaveBeenCalled();
  });

  it('membuat akun pembeli baru dengan password acak', async () => {
    const hasil = await masukAtauDaftarGoogle({ sub: `sub-baru-${stamp}`, email: email('baru'), name: 'Pembeli Baru' }, hash('hash-acak-baru'));
    expect(hasil.ok).toBe(true);
    const akun = await prisma.user.findUniqueOrThrow({ where: { email: email('baru') } });
    expect(akun).toMatchObject({ name: 'Pembeli Baru', role: 'customer', passwordHash: 'hash-acak-baru', googleSub: `sub-baru-${stamp}`, phone: null });
  });

  it('dua callback bersamaan untuk orang baru hanya membuat satu akun', async () => {
    const profil = { sub: `sub-balapan-${stamp}`, email: email('balapan'), name: 'Balapan' };
    const hasil = await Promise.all([masukAtauDaftarGoogle(profil, hash('h1')), masukAtauDaftarGoogle(profil, hash('h2'))]);
    expect(hasil.every((h) => h.ok)).toBe(true);
    expect(await prisma.user.count({ where: { email: email('balapan') } })).toBe(1);
  });

  it('menolak admin, akun dihapus, dan email yang tertaut ke akun Google lain, tanpa menghitung hash', async () => {
    const acak = hash('h');
    expect(await masukAtauDaftarGoogle({ sub: `sub-admin-${stamp}`, email: email('admin'), name: 'A' }, acak)).toEqual({ ok: false, alasan: 'admin' });
    expect(await prisma.user.findUniqueOrThrow({ where: { id: dibuat[1] } })).toMatchObject({ googleSub: null, passwordHash: 'hash-lama-uji' });
    expect(await masukAtauDaftarGoogle({ sub: `sub-hapus-${stamp}`, email: email('hapus'), name: 'H' }, acak)).toEqual({ ok: false, alasan: 'dihapus' });
    expect(await masukAtauDaftarGoogle({ sub: `sub-penyusup-${stamp}`, email: email('lama'), name: 'P' }, acak)).toEqual({ ok: false, alasan: 'tertaut-lain' });
    expect(acak).not.toHaveBeenCalled();
  });
});
