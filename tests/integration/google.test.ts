// Login Google (D21) dengan MySQL sungguhan: penautan email, akun baru, penolakan admin/dihapus.
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { prisma } from '@/lib/db';
import { masukAtauDaftarGoogle } from '@/lib/data/pengguna';

const stamp = Date.now();
const email = (n: string) => `google-${n}-${stamp}@example.test`;
const dibuat: number[] = [];

beforeAll(async () => {
  const database = new URL(process.env.DATABASE_URL!).pathname;
  if (!database.includes('verifikasi') && !database.endsWith('_test')) throw new Error('Google integration requires isolated database');
  for (const [nama, role] of [['lama', 'customer'], ['admin', 'admin'], ['hapus', 'customer']] as const) {
    const u = await prisma.user.create({ data: { name: `Uji ${nama}`, email: email(nama), passwordHash: 'hash-lama-uji', role, ...(nama === 'hapus' ? { deletedAt: new Date() } : {}) } });
    dibuat.push(u.id);
  }
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { OR: [{ id: { in: dibuat } }, { email: { startsWith: 'google-' , endsWith: `-${stamp}@example.test` } }] } });
  await prisma.$disconnect();
});

describe('masukAtauDaftarGoogle', () => {
  it('menautkan akun pembeli lama dengan email yang sama, lalu dikenali lewat ID Google', async () => {
    const pertama = await masukAtauDaftarGoogle({ sub: `sub-lama-${stamp}`, email: email('lama'), name: 'Nama Google' }, 'hash-acak');
    expect(pertama).toMatchObject({ ok: true, akun: { id: dibuat[0], role: 'customer', passwordHash: 'hash-lama-uji' } });
    expect((await prisma.user.findUniqueOrThrow({ where: { id: dibuat[0] } })).googleSub).toBe(`sub-lama-${stamp}`);
    // Nama dan password lama tidak diubah oleh login Google.
    expect((await prisma.user.findUniqueOrThrow({ where: { id: dibuat[0] } })).name).toBe('Uji lama');
    const kedua = await masukAtauDaftarGoogle({ sub: `sub-lama-${stamp}`, email: 'email-berubah@example.test', name: 'X' }, 'hash-acak');
    expect(kedua).toMatchObject({ ok: true, akun: { id: dibuat[0] } });
  });

  it('membuat akun pembeli baru dengan password acak', async () => {
    const hasil = await masukAtauDaftarGoogle({ sub: `sub-baru-${stamp}`, email: email('baru'), name: 'Pembeli Baru' }, 'hash-acak-baru');
    expect(hasil.ok).toBe(true);
    const akun = await prisma.user.findUniqueOrThrow({ where: { email: email('baru') } });
    expect(akun).toMatchObject({ name: 'Pembeli Baru', role: 'customer', passwordHash: 'hash-acak-baru', googleSub: `sub-baru-${stamp}`, phone: null });
  });

  it('dua callback bersamaan untuk orang baru hanya membuat satu akun', async () => {
    const profil = { sub: `sub-balapan-${stamp}`, email: email('balapan'), name: 'Balapan' };
    const hasil = await Promise.all([masukAtauDaftarGoogle(profil, 'h1'), masukAtauDaftarGoogle(profil, 'h2')]);
    expect(hasil.every((h) => h.ok)).toBe(true);
    expect(await prisma.user.count({ where: { email: email('balapan') } })).toBe(1);
  });

  it('menolak admin, akun dihapus, dan email yang tertaut ke akun Google lain', async () => {
    expect(await masukAtauDaftarGoogle({ sub: `sub-admin-${stamp}`, email: email('admin'), name: 'A' }, 'h')).toEqual({ ok: false, alasan: 'admin' });
    expect((await prisma.user.findUniqueOrThrow({ where: { id: dibuat[1] } })).googleSub).toBeNull();
    expect(await masukAtauDaftarGoogle({ sub: `sub-hapus-${stamp}`, email: email('hapus'), name: 'H' }, 'h')).toEqual({ ok: false, alasan: 'dihapus' });
    expect(await masukAtauDaftarGoogle({ sub: `sub-penyusup-${stamp}`, email: email('lama'), name: 'P' }, 'h')).toEqual({ ok: false, alasan: 'tertaut-lain' });
  });
});
