import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { SignJWT } from 'jose';
vi.mock('server-only', () => ({}));
import { buatTokenGambar, verifikasiTokenGambar } from './upload-token';
const secret = 'rahasia-token-gambar-untuk-unit-test-1234';
const image = '/uploads/12345678-1234-4234-8234-123456789012.webp';
beforeEach(() => vi.stubEnv('AUTH_SECRET', secret));
afterEach(() => vi.unstubAllEnvs());
describe('token unggahan dibatasi pengguna dan tujuan', () => {
  it('menerima upload milik pengguna dengan tujuan sama', async () => {
    const token = await buatTokenGambar(image, 7, 'product');
    expect(await verifikasiTokenGambar([token], 7, 'product', 8)).toEqual([image]);
  });
  it('menolak gambar milik pengguna lain dan cross-purpose', async () => {
    const token = await buatTokenGambar(image, 7, 'review');
    await expect(verifikasiTokenGambar([token], 8, 'review', 3)).rejects.toThrow('tidak valid');
    await expect(verifikasiTokenGambar([token], 7, 'product', 8)).rejects.toThrow('tidak valid');
  });
  it('menolak token palsu, expired, tanpa batas waktu, dan token sesi', async () => {
    const token = await buatTokenGambar(image, 7, 'product');
    await expect(verifikasiTokenGambar([`${token.slice(0, -4)}xxxx`], 7, 'product', 8)).rejects.toThrow();
    const key = new TextEncoder().encode(secret);
    const expired = await new SignJWT({ url: image, purpose: 'product' }).setProtectedHeader({ alg: 'HS256' }).setIssuer('tokokita-image-upload').setAudience('tokokita-image-save').setSubject('7').setExpirationTime(1).sign(key);
    const noExpiry = await new SignJWT({ url: image, purpose: 'product' }).setProtectedHeader({ alg: 'HS256' }).setIssuer('tokokita-image-upload').setAudience('tokokita-image-save').setSubject('7').sign(key);
    const session = await new SignJWT({ role: 'admin' }).setProtectedHeader({ alg: 'HS256' }).setSubject('7').setExpirationTime('1h').sign(key);
    for (const invalid of [expired, noExpiry, session]) await expect(verifikasiTokenGambar([invalid], 7, 'product', 8)).rejects.toThrow();
  });
  it('menolak URL sewenang-wenang dan duplicate token/URL serta batas jumlah', async () => {
    await expect(buatTokenGambar('https://evil.example/x.webp', 7, 'product')).rejects.toThrow();
    const token = await buatTokenGambar(image, 7, 'product');
    await expect(verifikasiTokenGambar([token, token], 7, 'product', 8)).rejects.toThrow();
    await expect(verifikasiTokenGambar([token], 7, 'product', 0)).rejects.toThrow();
  });
  it('menerima URL CDN tepat, menolak host atau path lain', async () => {
    vi.stubEnv('S3_PUBLIC_URL', 'https://cdn.example/tokokita');
    const url = `https://cdn.example/tokokita${image}`;
    const token = await buatTokenGambar(url, 7, 'banner');
    expect(await verifikasiTokenGambar([token], 7, 'banner', 1)).toEqual([url]);
    await expect(buatTokenGambar(`https://cdn.example.evil/tokokita${image}`, 7, 'banner')).rejects.toThrow();
  });
  it('menerima URL Vercel Blob publik milik proyek, menolak host atau path lain', async () => {
    const bagus = `https://abc123.public.blob.vercel-storage.com${image}`;
    const token = await buatTokenGambar(bagus, 7, 'product');
    expect(await verifikasiTokenGambar([token], 7, 'product', 1)).toEqual([bagus]);
    for (const buruk of [
      `https://abc123.public.blob.vercel-storage.com.evil.example${image}`,
      `http://abc123.public.blob.vercel-storage.com${image}`,
      `https://evil.example/public.blob.vercel-storage.com${image}`,
      'https://abc123.public.blob.vercel-storage.com/lain/12345678-1234-4234-8234-123456789012.webp',
      'https://abc123.public.blob.vercel-storage.com/uploads/../rahasia.webp',
      'https://abc123.private.blob.vercel-storage.com' + image,
    ]) await expect(buatTokenGambar(buruk, 7, 'product')).rejects.toThrow();
  });
});
