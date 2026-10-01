import { beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/lib/auth/akses', () => ({ requireUser: vi.fn().mockResolvedValue({ id: 2, role: 'customer' }) }));
const tx = vi.hoisted(() => ({ user: { updateMany: vi.fn() }, $queryRaw: vi.fn(), address: { findFirst: vi.fn(), count: vi.fn(), updateMany: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() } }));
const transaction = vi.hoisted(() => vi.fn());
vi.mock('@/lib/db', () => ({ prisma: { $transaction: transaction } }));
import { simpanAlamat, updateAlamat, hapusAlamat, setAlamatUtama } from './alamat';
const address = { label: 'Rumah', name: 'Pembeli Uji', phone: '081234567890', street: 'Jalan Uji Nomor 12', district: 'Tebet', city: 'Jakarta', province: 'DKI Jakarta', postalCode: '12820', isDefault: true };
beforeEach(() => { vi.clearAllMocks(); transaction.mockImplementation(async work => work(tx)); tx.$queryRaw.mockResolvedValue([{ id: 2 }]); tx.address.findFirst.mockResolvedValue(null); tx.address.count.mockResolvedValue(0); tx.address.create.mockResolvedValue({ id: 3 }); });
describe('alamat server', () => {
  it.each([() => simpanAlamat(address), () => updateAlamat(3, address), () => hapusAlamat(3), () => setAlamatUtama(3)])('DB offline selalu gagal tanpa ID/pesan sukses palsu', async action => { transaction.mockRejectedValue(new Error('offline')); expect((await action()).ok).toBe(false); });
  it('tidak memperbarui alamat pengguna lain', async () => { expect((await updateAlamat(3, address)).ok).toBe(false); expect(tx.address.update).not.toHaveBeenCalled(); expect(tx.address.findFirst).toHaveBeenCalledWith({ where: { id: 3, userId: 2 } }); });
  it('alamat pertama otomatis utama dalam transaksi', async () => { expect((await simpanAlamat({ ...address, isDefault: false })).ok).toBe(true); expect(tx.address.create).toHaveBeenCalledWith({ data: { ...address, userId: 2 } }); });
  it('penghapusan akun setelah cek sesi tidak dapat menyimpan kembali alamat pribadi', async () => { tx.$queryRaw.mockResolvedValue([]); expect((await simpanAlamat(address)).ok).toBe(false); expect(tx.address.create).not.toHaveBeenCalled(); });
});
