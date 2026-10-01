// Real MySQL/bcrypt/JWT tests. Only Next request/cookie/redirect boundaries are replaced.
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { randomBytes } from 'node:crypto';
import type { IsiSesi } from '@/lib/auth/token';
vi.mock('server-only', () => ({}));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next/headers', () => ({ headers: vi.fn(async () => new Headers({ 'x-real-ip': '127.0.0.1' })) }));
vi.mock('next/server', () => ({ after: vi.fn() }));
vi.mock('next/navigation', () => ({ redirect: vi.fn((url: string) => { throw new Error(`redirect:${url}`); }) }));
const request = vi.hoisted(() => ({ id: 0, token: null as string | null }));
vi.mock('@/lib/auth/akses', () => ({ requireUser: vi.fn(async () => ({ id: request.id, role: 'customer', name: 'Pembeli Auth', email: 'auth@example.test' })) }));
vi.mock('@/lib/auth/sesi', async () => {
  const { bacaTokenSesi, buatTokenSesi, kunciDariRahasia } = await import('@/lib/auth/token');
  return {
    ambilSesi: vi.fn(async () => bacaTokenSesi(request.token ?? undefined, kunciDariRahasia(process.env.AUTH_SECRET))),
    simpanSesi: vi.fn(async (isi: IsiSesi) => { request.token = await buatTokenSesi(isi, kunciDariRahasia(process.env.AUTH_SECRET)); }),
    hapusSesi: vi.fn(async () => { request.token = null; }),
  };
});
import { prisma } from '@/lib/db';
import { gantiPassword, hapusAkun } from '@/actions/akun';
import { resetPassword } from '@/actions/auth';
import { ambilPenggunaSaatIni } from '@/lib/data/pengguna';
import { hashPassword, cocokkanPassword } from '@/lib/auth/password';
import { buatTokenSesi, kunciDariRahasia } from '@/lib/auth/token';
import { versiPassword, versiSesiSah } from '@/lib/auth/password-version';
import { buatTokenReset } from '@/lib/auth/token-reset';
import { pakaiTokenReset, tokenResetMasihBerlaku } from '@/lib/data/reset-password';
const stamp = Date.now();
const users: number[] = [];
let categoryId = 0;
let productId = 0;
async function buyer() {
  const user = await prisma.user.create({ data: { name: 'Pembeli Auth Privasi', email: `auth-${stamp}-${users.length}@example.test`, phone: '081234567890', passwordHash: await hashPassword('lama12345') } });
  users.push(user.id); request.id = user.id;
  request.token = await buatTokenSesi({ userId: user.id, role: 'customer', passwordVersion: versiPassword(user.passwordHash) }, kunciDariRahasia(process.env.AUTH_SECRET));
  return user;
}
async function resetToken(userId: number) {
  const token = buatTokenReset();
  await prisma.passwordResetToken.create({ data: { userId, tokenHash: token.tokenHash, expiresAt: new Date(Date.now() + 3600000) } });
  return token;
}
beforeAll(async () => {
  const database = new URL(process.env.DATABASE_URL!).pathname;
  if (!database.includes('verifikasi') && !database.endsWith('_test')) throw new Error('Auth integration requires isolated test database');
  vi.stubEnv('AUTH_SECRET', randomBytes(32).toString('hex'));
  categoryId = (await prisma.category.create({ data: { name: 'Kategori Auth', slug: `auth-${stamp}` } })).id;
  productId = (await prisma.product.create({ data: { name: 'Produk Auth', slug: `auth-${stamp}`, categoryId, description: 'Produk fixture privasi akun.', brand: 'TokoKita', price: 150000, weight: 100, stock: 5, specs: {}, tags: [] } })).id;
});
afterAll(async () => {
  const orders = await prisma.order.findMany({ where: { userId: { in: users } }, select: { id: true } }); const ids = orders.map(o => o.id);
  await prisma.orderStatusLog.deleteMany({ where: { orderId: { in: ids } } });
  await prisma.orderItem.deleteMany({ where: { orderId: { in: ids } } });
  await prisma.order.deleteMany({ where: { id: { in: ids } } });
  await prisma.address.deleteMany({ where: { userId: { in: users } } });
  await prisma.passwordResetToken.deleteMany({ where: { userId: { in: users } } });
  await prisma.wishlistItem.deleteMany({ where: { userId: { in: users } } });
  await prisma.user.deleteMany({ where: { id: { in: users } } });
  if (productId) await prisma.product.delete({ where: { id: productId } });
  if (categoryId) await prisma.category.delete({ where: { id: categoryId } });
  await prisma.$disconnect();
  vi.unstubAllEnvs();
});
describe('MySQL auth dan anonimisasi', () => {
  it('ganti password memakai bcrypt nyata, menolak JWT lama dan memperbarui hanya sesi saat ini', async () => {
    const user = await buyer(); const oldToken = request.token; const reset = await resetToken(user.id);
    expect((await ambilPenggunaSaatIni())?.id).toBe(user.id);
    expect((await gantiPassword({ currentPassword: 'salah1234', newPassword: 'baru12345', confirmPassword: 'baru12345' })).ok).toBe(false);
    expect((await prisma.user.findUniqueOrThrow({ where: { id: user.id } })).passwordHash).toBe(user.passwordHash);
    expect((await gantiPassword({ currentPassword: 'lama12345', newPassword: 'baru12345', confirmPassword: 'baru12345' })).ok).toBe(true);
    const current = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(await cocokkanPassword('baru12345', current.passwordHash)).toBe(true); expect(await cocokkanPassword('lama12345', current.passwordHash)).toBe(false);
    expect(versiSesiSah(versiPassword(user.passwordHash), current.passwordHash)).toBe(false);
    expect(await tokenResetMasihBerlaku(reset.tokenHash)).toBe(false);
    const renewedToken = request.token; expect(renewedToken).not.toBe(oldToken); expect((await ambilPenggunaSaatIni())?.id).toBe(user.id);
    request.token = oldToken; expect(await ambilPenggunaSaatIni()).toBeNull(); request.token = renewedToken;
  });
  it('action reset memakai token sekali, mengganti hash MySQL, dan JWT lama tidak lagi diterima', async () => {
    const user = await buyer(); const oldToken = request.token; const reset = await resetToken(user.id);
    const form = new FormData(); form.set('token', reset.token); form.set('password', 'reset12345'); form.set('confirmPassword', 'reset12345');
    await expect(resetPassword(undefined, form)).rejects.toThrow('redirect:/masuk?reset=berhasil');
    expect(request.token).toBeNull();
    const current = await prisma.user.findUniqueOrThrow({ where: { id: user.id } }); expect(await cocokkanPassword('reset12345', current.passwordHash)).toBe(true);
    request.token = oldToken; expect(await ambilPenggunaSaatIni()).toBeNull();
    expect(await tokenResetMasihBerlaku(reset.tokenHash)).toBe(false); expect(await pakaiTokenReset(reset.tokenHash, await hashPassword('ulang12345'))).toBeNull();
    expect((await prisma.user.findUniqueOrThrow({ where: { id: user.id } })).passwordHash).toBe(current.passwordHash);
  });
  it('dua penggunaan token reset bersamaan hanya satu mengubah password', async () => {
    const user = await buyer(); const reset = await resetToken(user.id); const hash = await hashPassword('balapan12345');
    const results = await Promise.all([pakaiTokenReset(reset.tokenHash, hash), pakaiTokenReset(reset.tokenHash, hash)]);
    expect(results.filter(Boolean)).toHaveLength(1); expect((await prisma.user.findUniqueOrThrow({ where: { id: user.id } })).passwordHash).toBe(hash);
    expect(await ambilPenggunaSaatIni()).toBeNull();
  });
  it('hapus akun menghapus PII dan sesi serta mempertahankan nilai/item riwayat pesanan', async () => {
    const user = await buyer(); const oldToken = request.token;
    await prisma.address.create({ data: { userId: user.id, label: 'Rumah', name: user.name, phone: user.phone!, street: 'Jalan Pribadi Nomor 12', district: 'Tebet', city: 'Jakarta', province: 'DKI Jakarta', postalCode: '12820' } });
    await prisma.wishlistItem.create({ data: { userId: user.id, productId } }); await resetToken(user.id);
    const order = await prisma.order.create({ data: { orderNumber: `AUTH-${stamp}`, userId: user.id, subtotal: 150000, shippingCost: 15000, grandTotal: 165000, totalWeight: 100, status: 'delivered', paymentMethod: 'cod', paymentStatus: 'paid', deliveredAt: new Date(), shippingMethod: 'jne_reg', shippingAddress: { name: user.name, email: user.email, phone: user.phone, street: 'Jalan Pribadi Nomor 12' }, notes: `Hubungi ${user.phone}, ${user.email}`, items: { create: { productId, name: 'Snapshot Produk Auth', price: 150000, weight: 100, quantity: 1 } } } });
    await prisma.order.update({ where: { id: order.id }, data: { cancelReason: `Telepon pribadi ${user.phone}, ${user.email}`, statusLogs: { create: [{ status: 'confirmed', note: `Hubungi ${user.phone}`, changedById: user.id }, { status: 'cancelled', note: `Pesanan dibatalkan: ${user.email}`, changedById: user.id }] } } });
    expect((await hapusAkun({ password: 'salah1234', konfirmasi: true })).ok).toBe(false);
    expect((await hapusAkun({ password: 'lama12345', konfirmasi: true })).ok).toBe(true); expect(request.token).toBeNull();
    const deleted = await prisma.user.findUniqueOrThrow({ where: { id: user.id } }); expect(deleted.deletedAt).not.toBeNull(); expect(deleted.phone).toBeNull(); expect(deleted.email).not.toBe(user.email); expect(deleted.name).not.toBe(user.name); expect(await cocokkanPassword('lama12345', deleted.passwordHash)).toBe(false);
    const retained = await prisma.order.findUniqueOrThrow({ where: { id: order.id }, include: { items: true, statusLogs: true } });
    expect(retained.grandTotal).toBe(165000); expect(retained.items).toHaveLength(1); expect(retained.notes).toBeNull(); expect(retained.shippingAddress).toEqual({ name: 'Pengguna dihapus' });
    expect(retained.cancelReason).toBeNull(); expect(retained.statusLogs).toHaveLength(2); expect(retained.statusLogs.every(log => log.note === null)).toBe(true);
    expect(await prisma.address.count({ where: { userId: user.id } })).toBe(0); expect(await prisma.wishlistItem.count({ where: { userId: user.id } })).toBe(0); expect(await prisma.passwordResetToken.count({ where: { userId: user.id } })).toBe(0);
    request.token = oldToken; expect(await ambilPenggunaSaatIni()).toBeNull();
  });
});
