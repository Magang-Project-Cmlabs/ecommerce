import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
vi.mock('@/lib/auth/akses', () => ({ requireUser: vi.fn(async () => ({ id: 7, role: 'customer' })), requireAdmin: vi.fn(async () => ({ id: 7, role: 'admin' })) }));
vi.mock('@/lib/storage', () => ({ simpanGambar: vi.fn(async () => '/uploads/12345678-1234-4234-8234-123456789012.webp') }));
vi.mock('@/lib/data/katalog', () => ({ ambilItemUntukUlasan: vi.fn() }));
vi.mock('@/lib/auth/pembatas-auth', () => ({ catatBatasAuth: vi.fn() }));
import { requireAdmin, requireUser } from '@/lib/auth/akses';
import { simpanGambar } from '@/lib/storage';
import { verifikasiTokenGambar } from '@/lib/upload-token';
import { ambilItemUntukUlasan } from '@/lib/data/katalog';
import { catatBatasAuth } from '@/lib/auth/pembatas-auth';
import { unggahGambar } from './upload';
const eligible = () => ({ id: 12, productId: 3, order: { userId: 7, status: 'delivered' as const, deliveredAt: new Date() }, review: null });
beforeEach(() => { vi.stubEnv('AUTH_SECRET', 'secret-upload-action-unit-test-123456789'); vi.mocked(ambilItemUntukUlasan).mockReset(); vi.mocked(catatBatasAuth).mockReset(); vi.mocked(ambilItemUntukUlasan).mockResolvedValue(eligible() as Awaited<ReturnType<typeof ambilItemUntukUlasan>>); vi.mocked(catatBatasAuth).mockResolvedValue({ boleh: true }); });
afterEach(() => { vi.clearAllMocks(); vi.unstubAllEnvs(); });
function form(purpose = 'product', file = new File(['image'], 'test.png', { type: 'image/png' })) { const data = new FormData(); data.set('purpose', purpose); data.set('file', file); if (purpose === 'review') data.set('orderItemId', '12'); return data; }
describe('unggahan gambar melalui Server Action', () => {
  it('produk hanya setelah requireAdmin dan token terikat admin/purpose', async () => {
    const result = await unggahGambar(form()); expect(result.ok).toBe(true);
    expect(requireUser).toHaveBeenCalled(); expect(requireAdmin).toHaveBeenCalledWith('/admin');
    expect(simpanGambar).toHaveBeenCalledWith(expect.any(File), { minDimension: 800 });
    if (!result.ok) throw Error('Upload gagal'); expect(await verifikasiTokenGambar([result.token], 7, 'product', 8)).toEqual([result.url]);
  });
  it('review memerlukan sesi dan boleh dimensi lebih kecil', async () => {
    const result = await unggahGambar(form('review')); expect(result.ok).toBe(true);
    expect(requireAdmin).not.toHaveBeenCalled(); expect(simpanGambar).toHaveBeenCalledWith(expect.any(File), { minDimension: 1 });
    expect(ambilItemUntukUlasan).toHaveBeenCalledWith(12, 7); expect(catatBatasAuth).toHaveBeenCalledWith('upload-review:7:12');
    if (!result.ok) throw Error('Upload gagal'); expect(await verifikasiTokenGambar([result.token], 7, 'review', 3)).toEqual([result.url]);
  });
  it('review memerlukan orderItemId integer positif sebelum query/storage', async () => {
    for (const id of ['', '0', '-1', '12.5', 'NaN']) { const data = form('review'); data.set('orderItemId', id); expect((await unggahGambar(data)).ok).toBe(false); }
    const missing = form('review'); missing.delete('orderItemId'); expect((await unggahGambar(missing)).ok).toBe(false);
    expect(ambilItemUntukUlasan).not.toHaveBeenCalled(); expect(simpanGambar).not.toHaveBeenCalled();
  });
  it('akun tanpa item yang layak/owned tidak dapat mengunggah', async () => {
    vi.mocked(ambilItemUntukUlasan).mockResolvedValueOnce(null);
    expect((await unggahGambar(form('review'))).ok).toBe(false); expect(catatBatasAuth).not.toHaveBeenCalled(); expect(simpanGambar).not.toHaveBeenCalled();
  });
  it.each([
    { order: { userId: 99, status: 'delivered', deliveredAt: new Date() } },
    { order: { userId: 7, status: 'shipped', deliveredAt: null } },
    { order: { userId: 7, status: 'delivered', deliveredAt: new Date(Date.now() - 31 * 86400000) } },
    { review: { id: 9 } },
  ])('menolak item foreign/unfinished/expired/alreadyreviewed sebelum storage: %j', async overrides => {
    vi.mocked(ambilItemUntukUlasan).mockResolvedValueOnce({ ...eligible(), ...overrides } as Awaited<ReturnType<typeof ambilItemUntukUlasan>>);
    expect((await unggahGambar(form('review'))).ok).toBe(false); expect(catatBatasAuth).not.toHaveBeenCalled(); expect(simpanGambar).not.toHaveBeenCalled();
  });
  it('batas lima file menolak sebelum pemrosesan/storage', async () => {
    vi.mocked(catatBatasAuth).mockResolvedValueOnce({ boleh: false, tungguDetik: 900 }); const result = await unggahGambar(form('review'));
    expect(result.ok).toBe(false); if (result.ok) throw Error('Seharusnya ditolak'); expect(result.message).toContain('Terlalu banyak percobaan'); expect(simpanGambar).not.toHaveBeenCalled();
  });
  it('DB limiter gagal: fail closed dan pesan tidak membocorkan galat', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {}); vi.mocked(catatBatasAuth).mockRejectedValueOnce(new Error('secret database credentials'));
    const result = await unggahGambar(form('review')); expect(result.ok).toBe(false); expect(JSON.stringify(result)).not.toContain('secret'); expect(simpanGambar).not.toHaveBeenCalled(); vi.restoreAllMocks();
  });
  it('menolak banyak file, format salah, tujuan salah, dan >2MB sebelum storage', async () => {
    const multiple = form(); multiple.append('file', new File(['x'], 'two.png', { type: 'image/png' }));
    const invalid = [multiple, form('other'), form('product', new File(['x'], 'x.svg', { type: 'image/svg+xml' })), form('product', new File([new Uint8Array(2 * 1024 * 1024 + 1)], 'large.png', { type: 'image/png' }))];
    for (const data of invalid) expect((await unggahGambar(data)).ok).toBe(false);
    expect(simpanGambar).not.toHaveBeenCalled();
  });
  it('tidak menyimpan file ketika admin guard menolak', async () => {
    vi.mocked(requireAdmin).mockRejectedValueOnce(new Error('Akses ditolak'));
    await expect(unggahGambar(form())).rejects.toThrow('Akses ditolak'); expect(simpanGambar).not.toHaveBeenCalled();
  });
});
