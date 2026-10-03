import { afterEach, describe, expect, it, vi } from 'vitest';
import sharp from 'sharp';
vi.mock('server-only', () => ({}));
vi.mock('node:fs/promises', () => ({ mkdir: vi.fn(), writeFile: vi.fn(), unlink: vi.fn() }));
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { validasiGambar, simpanGambar, MAKS_GAMBAR_BYTES, kunciUnggahan, hapusFileGambar } from './storage';

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
  it('menolak Vercel Blob tanpa token sebelum mengirim request', async () => {
    vi.stubEnv('STORAGE_DRIVER', 'blob'); vi.stubEnv('BLOB_READ_WRITE_TOKEN', '');
    const request = vi.fn(); vi.stubGlobal('fetch', request);
    await expect(simpanGambar(await picture('png'))).rejects.toThrow('belum dikonfigurasi');
    expect(request).not.toHaveBeenCalled();
  });
  it('Vercel Blob PUT publik memakai nama acak dan tidak membocorkan token', async () => {
    vi.stubEnv('STORAGE_DRIVER', 'blob'); vi.stubEnv('BLOB_READ_WRITE_TOKEN', 'token-rahasia-uji');
    const request = vi.fn().mockResolvedValue(new Response(JSON.stringify({ url: 'https://abc.public.blob.vercel-storage.com/uploads/x.webp' }), { status: 200 })); vi.stubGlobal('fetch', request);
    const url = await simpanGambar(await picture('png'));
    expect(url).toBe('https://abc.public.blob.vercel-storage.com/uploads/x.webp');
    const [alamat, init] = request.mock.calls[0]!;
    const dipanggil = new URL(String(alamat));
    expect(dipanggil.origin + dipanggil.pathname).toBe('https://vercel.com/api/blob/');
    expect(dipanggil.searchParams.get('pathname')).toMatch(/^uploads\/[0-9a-f-]{36}\.webp$/);
    expect(init).toMatchObject({ method: 'PUT', headers: expect.objectContaining({ authorization: 'Bearer token-rahasia-uji', 'x-vercel-blob-access': 'public', 'x-content-type': 'image/webp', 'x-add-random-suffix': '0' }) });
    expect(url).not.toContain('token-rahasia-uji');
  });
  it('menolak balasan Blob yang bukan HTTPS atau gagal', async () => {
    vi.stubEnv('STORAGE_DRIVER', 'blob'); vi.stubEnv('BLOB_READ_WRITE_TOKEN', 'token-rahasia-uji');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 500 })));
    await expect(simpanGambar(await picture('png'))).rejects.toThrow('Gagal menyimpan gambar');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ url: 'http://evil.example/x.webp' }), { status: 200 })));
    await expect(simpanGambar(await picture('png'))).rejects.toThrow('Gagal menyimpan gambar');
  });
});

const UUID = '61dd6274-8b64-4b34-a7d9-e662e4407027';
const BLOB = `https://abc123.public.blob.vercel-storage.com/uploads/${UUID}.webp`;
describe('hapus file gambar unggahan', () => {
  it('hanya mengenali unggahan milik aplikasi', () => {
    expect(kunciUnggahan(`/uploads/${UUID}.webp`)).toBe(`uploads/${UUID}.webp`);
    expect(kunciUnggahan(BLOB)).toBe(`uploads/${UUID}.webp`);
    for (const bukan of ['/demo/tokokita-kaos-1.webp', '/uploads/../.env', `/uploads/${UUID}.png`, `https://evil.example/uploads/${UUID}.webp`,
      `http://abc.public.blob.vercel-storage.com/uploads/${UUID}.webp`, `${BLOB}?x=1`, 'bukan url', `/uploads/sub/${UUID}.webp`]) {
      expect(kunciUnggahan(bukan)).toBeNull();
    }
  });
  it('mengenali S3_PUBLIC_URL hanya bila dikonfigurasi', () => {
    expect(kunciUnggahan(`https://cdn.example/uploads/${UUID}.webp`)).toBeNull();
    vi.stubEnv('S3_PUBLIC_URL', 'https://cdn.example/');
    expect(kunciUnggahan(`https://cdn.example/uploads/${UUID}.webp`)).toBe(`uploads/${UUID}.webp`);
  });
  it('tidak menyentuh foto demo atau URL luar', async () => {
    const request = vi.fn(); vi.stubGlobal('fetch', request);
    expect(await hapusFileGambar('/demo/tokokita-kaos-1.webp')).toBe(false);
    expect(await hapusFileGambar(`https://evil.example/uploads/${UUID}.webp`)).toBe(false);
    expect(request).not.toHaveBeenCalled(); expect(unlink).not.toHaveBeenCalled();
  });
  it('Vercel Blob: POST /delete dengan URL dan token, token tidak bocor ke URL', async () => {
    vi.stubEnv('BLOB_READ_WRITE_TOKEN', 'token-rahasia-uji');
    const request = vi.fn().mockResolvedValue(new Response('{}', { status: 200 })); vi.stubGlobal('fetch', request);
    expect(await hapusFileGambar(BLOB)).toBe(true);
    const [alamat, init] = request.mock.calls[0]!;
    expect(alamat).toBe('https://vercel.com/api/blob/delete');
    expect(init).toMatchObject({ method: 'POST', body: JSON.stringify({ urls: [BLOB] }), headers: expect.objectContaining({ authorization: 'Bearer token-rahasia-uji' }) });
  });
  it('Vercel Blob tanpa token atau gagal: false, tanpa melempar', async () => {
    vi.stubEnv('BLOB_READ_WRITE_TOKEN', '');
    const request = vi.fn().mockResolvedValue(new Response('', { status: 500 })); vi.stubGlobal('fetch', request);
    expect(await hapusFileGambar(BLOB)).toBe(false); expect(request).not.toHaveBeenCalled();
    vi.stubEnv('BLOB_READ_WRITE_TOKEN', 'token-rahasia-uji');
    expect(await hapusFileGambar(BLOB)).toBe(false);
  });
  it('S3: DELETE bertanda tangan v4 ke kunci uploads', async () => {
    vi.stubEnv('S3_ENDPOINT', 'https://bucket.example'); vi.stubEnv('S3_BUCKET', 'tokokita'); vi.stubEnv('S3_ACCESS_KEY', 'test-access'); vi.stubEnv('S3_SECRET_KEY', 'test-secret'); vi.stubEnv('S3_PUBLIC_URL', 'https://cdn.example');
    const request = vi.fn().mockResolvedValue(new Response(null, { status: 204 })); vi.stubGlobal('fetch', request);
    expect(await hapusFileGambar(`https://cdn.example/uploads/${UUID}.webp`)).toBe(true);
    const [alamat, init] = request.mock.calls[0]!;
    expect(String(alamat)).toBe(`https://bucket.example/tokokita/uploads/${UUID}.webp`);
    expect(init).toMatchObject({ method: 'DELETE', headers: expect.objectContaining({ Authorization: expect.stringMatching(/^AWS4-HMAC-SHA256 Credential=test-access\/.*SignedHeaders=host;x-amz-content-sha256;x-amz-date/) }) });
    expect(init.body).toBeUndefined(); expect(JSON.stringify(request.mock.calls)).not.toContain('test-secret');
  });
  it('lokal: menghapus berkas di public/uploads, berkas hilang dianggap beres, production dilewati', async () => {
    expect(await hapusFileGambar(`/uploads/${UUID}.webp`)).toBe(true);
    expect(unlink).toHaveBeenCalledWith(expect.stringMatching(/[\\/]public[\\/]uploads[\\/]61dd6274-8b64-4b34-a7d9-e662e4407027\.webp$/));
    vi.mocked(unlink).mockRejectedValueOnce(Object.assign(new Error('x'), { code: 'ENOENT' }));
    expect(await hapusFileGambar(`/uploads/${UUID}.webp`)).toBe(true);
    vi.mocked(unlink).mockRejectedValueOnce(Object.assign(new Error('x'), { code: 'EACCES' }));
    expect(await hapusFileGambar(`/uploads/${UUID}.webp`)).toBe(false);
    vi.stubEnv('NODE_ENV', 'production'); vi.mocked(unlink).mockClear();
    expect(await hapusFileGambar(`/uploads/${UUID}.webp`)).toBe(false); expect(unlink).not.toHaveBeenCalled();
  });
});
