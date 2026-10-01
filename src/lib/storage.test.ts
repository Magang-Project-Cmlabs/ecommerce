import { afterEach, describe, expect, it, vi } from 'vitest';
import sharp from 'sharp';
vi.mock('server-only', () => ({}));
vi.mock('node:fs/promises', () => ({ mkdir: vi.fn(), writeFile: vi.fn() }));
import { mkdir, writeFile } from 'node:fs/promises';
import { validasiGambar, simpanGambar, MAKS_GAMBAR_BYTES } from './storage';

async function picture(format: 'png' | 'jpeg' | 'webp', size = 800, name = 'foto.png') {
  const buffer = await sharp({ create: { width: size, height: size, channels: 3, background: '#ff7700' } }).toFormat(format).toBuffer();
  return new File([new Uint8Array(buffer)], name, { type: `image/${format}` });
}
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.clearAllMocks(); });
describe('unggah gambar aman', () => {
  it.each(['png', 'jpeg', 'webp'] as const)('menerima %s valid dan menulis WebP tanpa metadata', async (format) => {
    const buffer = await validasiGambar(await picture(format));
    const meta = await sharp(buffer).metadata();
    expect(meta.format).toBe('webp'); expect(meta.width).toBe(800); expect(meta.exif).toBeUndefined();
  });
  it('menolak MIME palsu dan isi rusak', async () => {
    const png = await picture('png');
    await expect(validasiGambar(new File([await png.arrayBuffer()], 'x.jpg', { type: 'image/jpeg' }))).rejects.toThrow('Format');
    await expect(validasiGambar(new File(['<script>alert(1)</script>'], 'x.png', { type: 'image/png' }))).rejects.toThrow('bukan gambar');
  });
  it('menolak gambar produk <800 px, mendukung foto ulasan kecil', async () => {
    const small = await picture('png', 100);
    await expect(validasiGambar(small)).rejects.toThrow('800');
    expect(await validasiGambar(small, 1)).toBeInstanceOf(Buffer);
  });
  it('menolak ukuran di atas 2 MB dan berkas kosong', async () => {
    await expect(validasiGambar(new File([new Uint8Array(MAKS_GAMBAR_BYTES + 1)], 'x.png', { type: 'image/png' }))).rejects.toThrow('2 MB');
    await expect(validasiGambar(new File([], 'x.png', { type: 'image/png' }))).rejects.toThrow('2 MB');
  });
  it('memakai nama acak dan tidak memakai path unggahan pengguna', async () => {
    vi.stubEnv('STORAGE_DRIVER', 'local');
    const file = await picture('png', 800, '../../secret.png');
    const first = await simpanGambar(file); const second = await simpanGambar(file);
    expect(first).toMatch(/^\/uploads\/[0-9a-f-]{36}\.webp$/); expect(first).not.toBe(second);
    expect(mkdir).toHaveBeenCalledWith(expect.stringMatching(/[\\/]public[\\/]uploads$/), { recursive: true });
    expect(writeFile).toHaveBeenCalledWith(expect.stringMatching(/[\\/]uploads[\\/][0-9a-f-]{36}\.webp$/), expect.any(Buffer), { flag: 'wx' });
  });
  it('menolak S3 tidak terkonfigurasi sebelum mengirim request', async () => {
    vi.stubEnv('STORAGE_DRIVER', 's3'); vi.stubEnv('S3_ENDPOINT', '');
    await expect(simpanGambar(await picture('png'))).rejects.toThrow('belum dikonfigurasi');
  });
  it('menolak local storage di production agar upload tidak menghasilkan tautan 404', async () => {
    vi.stubEnv('NODE_ENV', 'production'); vi.stubEnv('STORAGE_DRIVER', 'local');
    await expect(simpanGambar(await picture('png'))).rejects.toThrow('S3');
    expect(writeFile).not.toHaveBeenCalled();
  });
  it('S3 PUT memakai signature v4, nama acak, dan URL publik tanpa secret', async () => {
    vi.stubEnv('STORAGE_DRIVER', 's3'); vi.stubEnv('S3_ENDPOINT', 'https://bucket.example'); vi.stubEnv('S3_BUCKET', 'tokokita'); vi.stubEnv('S3_ACCESS_KEY', 'test-access'); vi.stubEnv('S3_SECRET_KEY', 'test-secret'); vi.stubEnv('S3_PUBLIC_URL', 'https://cdn.example');
    const request = vi.fn().mockResolvedValue(new Response('', { status: 200 })); vi.stubGlobal('fetch', request);
    const url = await simpanGambar(await picture('png'));
    expect(url).toMatch(/^https:\/\/cdn.example\/uploads\/[0-9a-f-]{36}\.webp$/);
    expect(request).toHaveBeenCalledWith(expect.any(URL), expect.objectContaining({ method: 'PUT', body: expect.any(Uint8Array), headers: expect.objectContaining({ Authorization: expect.stringMatching(/^AWS4-HMAC-SHA256 Credential=test-access\//), 'Content-Type': 'image/webp' }) }));
    expect(JSON.stringify(request.mock.calls)).not.toContain('test-secret');
  });
});
