import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn(), updateTag: vi.fn() }));
const mocks = vi.hoisted(() => ({ user: vi.fn(), item: vi.fn(), tokens: vi.fn(), transaction: vi.fn(), create: vi.fn(), productUpdate: vi.fn(), orderItem: vi.fn(), aggregate: vi.fn() }));
vi.mock('@/lib/auth/akses', () => ({ requireUser: mocks.user }));
vi.mock('@/lib/data/katalog', () => ({ ambilItemUntukUlasan: mocks.item }));
vi.mock('@/lib/upload-token', () => ({ verifikasiTokenGambar: mocks.tokens }));
vi.mock('@/lib/db', () => ({ prisma: { $transaction: mocks.transaction } }));
import { kirimUlasan } from './katalog';

function form(tokens: unknown = []) {
  const data = new FormData(); data.set('orderItemId', '7'); data.set('rating', '5'); data.set('content', 'Produk sangat bagus dan sesuai deskripsi.'); data.set('uploadTokens', JSON.stringify(tokens)); return data;
}
const item = { id: 7, productId: 10, review: null, order: { userId: 2, status: 'delivered', deliveredAt: new Date() } };
beforeEach(() => {
  vi.clearAllMocks();
  mocks.user.mockResolvedValue({ id: 2, role: 'customer' }); mocks.item.mockResolvedValue(item);
  mocks.orderItem.mockResolvedValue(item); mocks.productUpdate.mockResolvedValue({ slug: 'produk-ulasan' }); mocks.create.mockResolvedValue({ id: 1 }); mocks.aggregate.mockResolvedValue({ _avg: { rating: 5 }, _count: { id: 1 } });
  mocks.tokens.mockResolvedValue(['/uploads/photo1.webp', '/uploads/photo2.webp', '/uploads/photo3.webp']);
  mocks.transaction.mockImplementation((run) => run({ product: { update: mocks.productUpdate }, orderItem: { findFirstOrThrow: mocks.orderItem }, review: { create: mocks.create, aggregate: mocks.aggregate } }));
});

describe('ulasan memakai bukti upload server, bukan URL client', () => {
  it('memverifikasi token sesuai pemilik/purpose/batas dan menyimpan URL hasil server dalam transaksi', async () => {
    expect((await kirimUlasan(form(['a.b.c', 'd.e.f', 'g.h.i']))).success).toBe(true);
    expect(mocks.tokens).toHaveBeenCalledWith(['a.b.c', 'd.e.f', 'g.h.i'], 2, 'review', 3);
    expect(mocks.item).toHaveBeenCalledWith(7, 2);
    expect(mocks.create).toHaveBeenCalledWith({ data: expect.objectContaining({ images: ['/uploads/photo1.webp', '/uploads/photo2.webp', '/uploads/photo3.webp'], userId: 2, productId: 10 }) });
    expect(mocks.productUpdate).toHaveBeenLastCalledWith({ where: { id: 10 }, data: { rating: 5, reviewCount: 1 } });
  });
  it.each(['https://evil.example/photo.png', '/uploads/fake.webp', 'javascript:alert(1)'])('menolak URL client %s sebelum DB', async (url) => {
    expect((await kirimUlasan(form([url]))).success).toBe(false); expect(mocks.item).not.toHaveBeenCalled(); expect(mocks.transaction).not.toHaveBeenCalled();
  });
  it('menolak token gagal signature/kedaluwarsa/bukan pemilik sebelum transaksi', async () => {
    mocks.tokens.mockRejectedValue(new Error('Token bukan milik pengguna.'));
    expect((await kirimUlasan(form(['a.b.c']))).success).toBe(false); expect(mocks.transaction).not.toHaveBeenCalled();
  });
  it('menolak lebih3 token dan JSON malformed', async () => {
    expect((await kirimUlasan(form(Array(4).fill('a.b.c')))).success).toBe(false);
    const data = form(); data.set('uploadTokens', '{'); expect((await kirimUlasan(data)).success).toBe(false); expect(mocks.item).not.toHaveBeenCalled();
  });
  it('menolak file mentah pada action final sehingga semua foto harus lewat upload terpisah', async () => {
    const data = form(); data.set('foto', new File([new Uint8Array(2 * 1024 * 1024)], 'photo.png', { type: 'image/png' }));
    expect((await kirimUlasan(data)).success).toBe(false); expect(mocks.item).not.toHaveBeenCalled();
  });
  it('memeriksa ulang delivered/duplikasi di transaksi', async () => {
    mocks.orderItem.mockResolvedValue({ ...item, review: { id: 99 } });
    expect((await kirimUlasan(form(['a.b.c']))).success).toBe(false); expect(mocks.create).not.toHaveBeenCalled();
  });
});
