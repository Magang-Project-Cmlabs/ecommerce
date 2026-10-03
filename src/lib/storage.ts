import 'server-only';
import { createHash, createHmac, randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp, { type Metadata } from 'sharp';

export const MAKS_GAMBAR_BYTES = 2 * 1024 * 1024;

/** Dekode dan encode ulang isi, bukan mempercayai ekstensi/nama/MIME dari browser. */
export async function validasiGambar(file: File, minDimension = 800) {
  if (!file.size || file.size > MAKS_GAMBAR_BYTES) throw new Error('Gambar maksimal 2 MB.');
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Gunakan gambar JPG, PNG, atau WebP.');
  const input = Buffer.from(await file.arrayBuffer());
  let metadata: Metadata;
  try { metadata = await sharp(input, { limitInputPixels: 40_000_000, animated: true }).metadata(); }
  catch { throw new Error('Isi berkas bukan gambar yang valid.'); }
  const formats: Record<string, string> = { jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };
  if (!metadata.format || formats[metadata.format] !== file.type || (metadata.pages ?? 1) > 1) {
    throw new Error('Format gambar tidak cocok atau gambar animasi tidak didukung.');
  }
  if ((metadata.width ?? 0) < minDimension || (metadata.height ?? 0) < minDimension) {
    throw new Error(`Gambar minimal ${minDimension} × ${minDimension} piksel.`);
  }
  try {
    const buffer = await sharp(input, { limitInputPixels: 40_000_000 }).rotate().webp({ quality: 85 }).toBuffer();
    if (buffer.length > MAKS_GAMBAR_BYTES) throw new Error('Gambar hasil pemrosesan maksimal 2 MB.');
    return buffer;
  } catch (error) {
    if (error instanceof Error && error.message.includes('maksimal')) throw error;
    throw new Error('Gambar tidak dapat diproses.');
  }
}

const sha256 = (value: string | Buffer) => createHash('sha256').update(value).digest('hex');
const hmac = (key: string | Buffer, value: string) => createHmac('sha256', key).update(value).digest();
const encode = (value: string) => encodeURIComponent(value).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);

/** Request S3-compatible (PUT/DELETE) dengan AWS Signature v4, tanpa SDK. */
async function permintaanS3(method: 'PUT' | 'DELETE', key: string, buffer?: Buffer) {
  const { S3_ENDPOINT: endpoint, S3_BUCKET: bucket, S3_ACCESS_KEY: access, S3_SECRET_KEY: secret, S3_PUBLIC_URL: publicUrl } = process.env;
  if (!endpoint || !bucket || !access || !secret || !publicUrl) throw new Error('Penyimpanan gambar belum dikonfigurasi. Hubungi administrator.');
  const url = new URL(endpoint);
  if (url.protocol !== 'https:') throw new Error('Penyimpanan S3 harus menggunakan HTTPS.');
  url.pathname = `${url.pathname.replace(/\/$/, '')}/${encode(bucket)}/${key.split('/').map(encode).join('/')}`;
  url.search = '';
  const dateTime = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '');
  const date = dateTime.slice(0, 8);
  const region = process.env.S3_REGION || 'auto';
  const payloadHash = sha256(buffer ?? '');
  const denganIsi = method === 'PUT';
  const signedHeaders = `${denganIsi ? 'content-type;' : ''}host;x-amz-content-sha256;x-amz-date`;
  const headers = `${denganIsi ? 'content-type:image/webp\n' : ''}host:${url.host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${dateTime}\n`;
  const canonical = `${method}\n${url.pathname}\n\n${headers}\n${signedHeaders}\n${payloadHash}`;
  const scope = `${date}/${region}/s3/aws4_request`;
  const signingKey = hmac(hmac(hmac(hmac(`AWS4${secret}`, date), region), 's3'), 'aws4_request');
  const signature = createHmac('sha256', signingKey).update(`AWS4-HMAC-SHA256\n${dateTime}\n${scope}\n${sha256(canonical)}`).digest('hex');
  const response = await fetch(url, {
    method, ...(buffer ? { body: new Uint8Array(buffer) } : {}), signal: AbortSignal.timeout(30_000),
    headers: {
      ...(denganIsi ? { 'Content-Type': 'image/webp' } : {}), 'X-Amz-Date': dateTime, 'X-Amz-Content-Sha256': payloadHash,
      Authorization: `AWS4-HMAC-SHA256 Credential=${access}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
    },
  });
  return { ok: response.ok, publicUrl };
}

async function simpanS3(key: string, buffer: Buffer) {
  const { ok, publicUrl } = await permintaanS3('PUT', key, buffer);
  if (!ok) throw new Error('Gagal menyimpan gambar. Silakan coba lagi.');
  return `${publicUrl.replace(/\/$/, '')}/${key}`;
}

/**
 * Vercel Blob (store publik) lewat API HTTP, tanpa SDK: PUT ke vercel.com/api/blob.
 * Token BLOB_READ_WRITE_TOKEN dipasang Vercel sendiri saat store dihubungkan ke proyek.
 */
async function simpanBlob(key: string, buffer: Buffer) {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) throw new Error('Penyimpanan gambar belum dikonfigurasi. Hubungi administrator.');
  const response = await fetch(`https://vercel.com/api/blob/?${new URLSearchParams({ pathname: key })}`, {
    method: 'PUT', body: new Uint8Array(buffer), signal: AbortSignal.timeout(30_000),
    headers: {
      authorization: `Bearer ${token}`, 'x-api-version': '12', 'x-vercel-blob-access': 'public',
      'x-content-type': 'image/webp', 'x-add-random-suffix': '0', 'x-allow-overwrite': '0',
    },
  });
  const hasil = response.ok ? await response.json().catch(() => null) as { url?: unknown } | null : null;
  const alamat = typeof hasil?.url === 'string' ? hasil.url : '';
  if (!alamat.startsWith('https://')) throw new Error('Gagal menyimpan gambar. Silakan coba lagi.');
  return alamat;
}

export async function simpanGambar(file: File, options: { minDimension?: number } = {}) {
  const driver = process.env.STORAGE_DRIVER || (process.env.NODE_ENV === 'production' ? 's3' : 'local');
  if (process.env.NODE_ENV === 'production' && driver !== 's3' && driver !== 'blob') throw new Error('Unggahan production memerlukan penyimpanan S3 atau Vercel Blob. Hubungi administrator untuk mengaktifkannya.');
  const buffer = await validasiGambar(file, options.minDimension ?? 800);
  const filename = `${randomUUID()}.webp`;
  if (driver === 's3') return simpanS3(`uploads/${filename}`, buffer);
  if (driver === 'blob') return simpanBlob(`uploads/${filename}`, buffer);
  if (driver !== 'local') throw new Error('Driver penyimpanan gambar tidak didukung.');
  const directory = path.join(process.cwd(), 'public', 'uploads');
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, filename), buffer, { flag: 'wx' });
  return `/uploads/${filename}`;
}

const NAMA_UNGGAHAN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.webp$/;

/**
 * Kunci `uploads/<uuid>.webp` bila URL adalah unggahan milik aplikasi ini
 * (lokal, Vercel Blob publik, atau S3_PUBLIC_URL). Selain itu null: foto demo,
 * URL luar, dan path aneh tidak pernah dihapus.
 */
export function kunciUnggahan(alamat: string): string | null {
  const nama = (pathname: string) => {
    const m = /^\/uploads\/([^/]+)$/.exec(pathname);
    return m && NAMA_UNGGAHAN.test(m[1]!) ? `uploads/${m[1]}` : null;
  };
  if (alamat.startsWith('/')) return nama(alamat);
  let url: URL;
  try { url = new URL(alamat); } catch { return null; }
  if (url.protocol !== 'https:' || url.search || url.hash) return null;
  if (url.hostname.endsWith('.public.blob.vercel-storage.com')) return nama(url.pathname);
  const publik = process.env.S3_PUBLIC_URL?.replace(/\/$/, '');
  if (publik && alamat.startsWith(`${publik}/`)) return nama(`/${alamat.slice(publik.length + 1)}`);
  return null;
}

/** Menghapus satu file unggahan dari penyimpanannya. true bila terhapus (atau memang sudah tidak ada). */
export async function hapusFileGambar(alamat: string): Promise<boolean> {
  const kunci = kunciUnggahan(alamat);
  if (!kunci) return false;
  if (alamat.startsWith('/')) {
    // Berkas lokal hanya ada di mesin pengembangan; nama sudah divalidasi (tanpa ../).
    if (process.env.NODE_ENV === 'production') return false;
    try { await unlink(path.join(process.cwd(), 'public', kunci)); return true; }
    catch (error) { return (error as NodeJS.ErrnoException).code === 'ENOENT'; }
  }
  if (new URL(alamat).hostname.endsWith('.public.blob.vercel-storage.com')) {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) return false;
    const response = await fetch('https://vercel.com/api/blob/delete', {
      method: 'POST', signal: AbortSignal.timeout(15_000), body: JSON.stringify({ urls: [alamat] }),
      headers: { authorization: `Bearer ${token}`, 'x-api-version': '12', 'content-type': 'application/json' },
    });
    return response.ok;
  }
  const { ok } = await permintaanS3('DELETE', kunci);
  return ok;
}
