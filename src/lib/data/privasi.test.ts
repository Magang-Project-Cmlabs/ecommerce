import { beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
const mocks = vi.hoisted(() => ({ address: vi.fn(), order: vi.fn(), user: vi.fn(), login: vi.fn() }));
vi.mock('@/lib/db', () => ({ prisma: { address: { findFirst: mocks.address }, order: { findFirst: mocks.order }, user: { findFirst: mocks.user, findUnique: mocks.login } } }));
vi.mock('@/lib/auth/sesi', () => ({ ambilSesi: vi.fn().mockResolvedValue({ userId: 2, role: 'customer', passwordVersion: 'valid' }) }));
vi.mock('@/lib/auth/password-version', () => ({ versiSesiSah: vi.fn().mockReturnValue(true) }));
import { ambilAlamatById } from './alamat';
import { ambilDetailPesanan } from './pesanan';
import { ambilPenggunaSaatIni, cariAkunUntukMasuk } from './pengguna';
beforeEach(() => { vi.clearAllMocks(); mocks.address.mockResolvedValue(null); mocks.order.mockResolvedValue(null); mocks.user.mockResolvedValue(null); mocks.login.mockResolvedValue(null); });
describe('data pribadi hanya DB pemilik', () => {
  it('alamat/pesanan tak ditemukan tidak membuka data demo', async () => {
    expect(await ambilAlamatById(1, 9)).toBeNull(); expect(mocks.address).toHaveBeenCalledWith({ where: { id: 1, userId: 9 } });
    expect(await ambilDetailPesanan('INV-202609-0001', 9)).toBeNull(); expect(mocks.order).toHaveBeenCalledWith(expect.objectContaining({ where: { orderNumber: 'INV-202609-0001', userId: 9 } }));
  });
  it('DB gagal tidak mengembalikan alamat/pesanan orang lain', async () => {
    mocks.address.mockRejectedValue(new Error('offline')); mocks.order.mockRejectedValue(new Error('offline'));
    await expect(ambilAlamatById(1, 9)).rejects.toThrow('offline'); await expect(ambilDetailPesanan('INV-202609-0001', 9)).rejects.toThrow('offline');
  });
  it('DB gagal tidak mengesahkan akun demo atau login demo', async () => {
    mocks.user.mockRejectedValue(new Error('offline')); mocks.login.mockRejectedValue(new Error('offline'));
    await expect(ambilPenggunaSaatIni()).rejects.toThrow('offline'); await expect(cariAkunUntukMasuk('demo@tokokita.id')).rejects.toThrow('offline');
  });
  it('hash password tidak keluar dari getter sesi pengguna', async () => {
    mocks.user.mockResolvedValue({ id: 2, name: 'Pembeli', email: 'user@example.com', role: 'customer', passwordHash: 'secret-hash' });
    expect(await ambilPenggunaSaatIni()).toEqual({ id: 2, name: 'Pembeli', email: 'user@example.com', role: 'customer' });
  });
});
