import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
const prisma = vi.hoisted(() => ({
  productImage: { findMany: vi.fn() },
  category: { findMany: vi.fn() },
  banner: { findMany: vi.fn() },
  orderItem: { findMany: vi.fn() },
}));
vi.mock('@/lib/db', () => ({ prisma }));
const hapusFileGambar = vi.hoisted(() => vi.fn());
vi.mock('@/lib/storage', async (asli) => ({ ...(await asli<typeof import('@/lib/storage')>()), hapusFileGambar }));

import { hapusGambarTakTerpakai } from './gambar';

const blob = (n: number) => `https://abc.public.blob.vercel-storage.com/uploads/00000000-0000-4000-8000-00000000000${n}.webp`;
const kosong = () => { for (const tabel of Object.values(prisma)) tabel.findMany.mockResolvedValue([]); };
afterEach(() => vi.clearAllMocks());

describe('hapus gambar tak terpakai', () => {
  it('menghapus unggahan yang tidak dirujuk, melewati foto demo', async () => {
    kosong(); hapusFileGambar.mockResolvedValue(true);
    expect(await hapusGambarTakTerpakai([blob(1), '/demo/tokokita-kaos-1.webp', null, blob(1)])).toBe(1);
    expect(hapusFileGambar).toHaveBeenCalledTimes(1);
    expect(hapusFileGambar).toHaveBeenCalledWith(blob(1));
  });
  it('mempertahankan file yang masih dipakai produk lain, kategori, banner, atau riwayat pesanan', async () => {
    kosong(); hapusFileGambar.mockResolvedValue(true);
    prisma.productImage.findMany.mockResolvedValue([{ url: blob(1) }]);
    prisma.category.findMany.mockResolvedValue([{ image: blob(2) }]);
    prisma.banner.findMany.mockResolvedValue([{ image: blob(3) }]);
    prisma.orderItem.findMany.mockResolvedValue([{ image: blob(4) }]);
    expect(await hapusGambarTakTerpakai([blob(1), blob(2), blob(3), blob(4), blob(5)])).toBe(1);
    expect(hapusFileGambar).toHaveBeenCalledTimes(1);
    expect(hapusFileGambar).toHaveBeenCalledWith(blob(5));
    expect(prisma.orderItem.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { image: { in: [blob(1), blob(2), blob(3), blob(4), blob(5)] } } }));
  });
  it('tidak menghapus apa pun bila pemeriksaan database gagal', async () => {
    kosong(); prisma.orderItem.findMany.mockRejectedValue(new Error('db mati'));
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(await hapusGambarTakTerpakai([blob(1)])).toBe(0);
    expect(hapusFileGambar).not.toHaveBeenCalled();
  });
  it('kegagalan satu berkas tidak menghentikan yang lain dan tidak melempar', async () => {
    kosong(); vi.spyOn(console, 'warn').mockImplementation(() => {});
    hapusFileGambar.mockRejectedValueOnce(new Error('jaringan')).mockResolvedValueOnce(true);
    expect(await hapusGambarTakTerpakai([blob(1), blob(2)])).toBe(1);
  });
  it('tanpa kandidat tidak menyentuh database', async () => {
    expect(await hapusGambarTakTerpakai(['/demo/x.webp', undefined])).toBe(0);
    expect(prisma.productImage.findMany).not.toHaveBeenCalled();
  });
});
