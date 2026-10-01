import { beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/lib/auth/akses', () => ({ requireUser: vi.fn().mockResolvedValue({ id: 2, role: 'customer' }) }));
const mocks = vi.hoisted(() => ({ update: vi.fn(), transaction: vi.fn(), hash: vi.fn(), logout: vi.fn(), save: vi.fn() }));
vi.mock('@/lib/data/pengguna', () => ({ ambilHashPassword: mocks.hash }));
vi.mock('@/lib/db', () => ({ prisma: { user: { updateMany: mocks.update }, $transaction: mocks.transaction } }));
vi.mock('@/lib/auth/sesi', () => ({ hapusSesi: mocks.logout, simpanSesi: mocks.save }));
vi.mock('@/lib/auth/password', () => ({ hashPassword: vi.fn().mockResolvedValue('new-hash'), cocokkanPassword: vi.fn().mockResolvedValue(true) }));
vi.mock('@/lib/auth/password-version', () => ({ versiPassword: vi.fn().mockReturnValue('version') }));
import { ubahProfil, gantiPassword, hapusAkun } from './akun';
beforeEach(() => { vi.clearAllMocks(); mocks.hash.mockResolvedValue({ passwordHash: 'old-hash' }); });
describe('akun tanpa sukses palsu', () => {
  it('profil DB gagal -> gagal', async () => { mocks.update.mockRejectedValue(new Error('offline')); expect((await ubahProfil({ name: 'Pembeli Uji', phone: null })).ok).toBe(false); });
  it('password DB gagal -> gagal dan sesi tidak diganti', async () => { mocks.transaction.mockRejectedValue(new Error('offline')); expect((await gantiPassword({ currentPassword: 'lama1234', newPassword: 'baru1234', confirmPassword: 'baru1234' })).ok).toBe(false); expect(mocks.save).not.toHaveBeenCalled(); });
  it('hapus akun gagal tidak mencabut sesi/mengaku berhasil', async () => { mocks.transaction.mockRejectedValue(new Error('offline')); expect((await hapusAkun({ password: 'lama1234', konfirmasi: true })).ok).toBe(false); expect(mocks.logout).not.toHaveBeenCalled(); });
});
