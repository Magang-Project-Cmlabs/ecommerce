import 'server-only';
import { createHash, createHmac, randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
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

/** S3-compatible PUT dengan AWS Signature v4, tanpa SDK. */
async function simpanS3(key: string, buffer: Buffer) {
  const { S3_ENDPOINT: endpoint, S3_BUCKET: bucket, S3_ACCESS_KEY: access, S3_SECRET_KEY: secret, S3_PUBLIC_URL: publicUrl } = process.env;
  if (!endpoint || !bucket || !access || !secret || !publicUrl) throw new Error('Penyimpanan gambar belum dikonfigurasi. Hubungi administrator.');
  const url = new URL(endpoint);
  if (url.protocol !== 'https:') throw new Error('Penyimpanan S3 harus menggunakan HTTPS.');
  url.pathname = `${url.pathname.replace(/\/$/, '')}/${encode(bucket)}/${key.split('/').map(encode).join('/')}`;
  url.search = '';
  const dateTime = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '');
  const date = dateTime.slice(0, 8);
  const region = process.env.S3_REGION || 'auto';
  const payloadHash = sha256(buffer);
  const signedHeaders = 'content-type;host;x-amz-content-sha256;x-amz-date';
  const headers = `content-type:image/webp\nhost:${url.host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${dateTime}\n`;
  const canonical = `PUT\n${url.pathname}\n\n${headers}\n${signedHeaders}\n${payloadHash}`;
  const scope = `${date}/${region}/s3/aws4_request`;
  const signingKey = hmac(hmac(hmac(hmac(`AWS4${secret}`, date), region), 's3'), 'aws4_request');
  const signature = createHmac('sha256', signingKey).update(`AWS4-HMAC-SHA256\n${dateTime}\n${scope}\n${sha256(canonical)}`).digest('hex');
  const response = await fetch(url, {
    method: 'PUT', body: new Uint8Array(buffer), signal: AbortSignal.timeout(30_000),
    headers: {
      'Content-Type': 'image/webp', 'X-Amz-Date': dateTime, 'X-Amz-Content-Sha256': payloadHash,
      Authorization: `AWS4-HMAC-SHA256 Credential=${access}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
    },
  });
  if (!response.ok) throw new Error('Gagal menyimpan gambar. Silakan coba lagi.');
  return `${publicUrl.replace(/\/$/, '')}/${key}`;
}

export async function simpanGambar(file: File, options: { minDimension?: number } = {}) {
  const driver = process.env.STORAGE_DRIVER || (process.env.NODE_ENV === 'production' ? 's3' : 'local');
  if (process.env.NODE_ENV === 'production' && driver !== 's3') throw new Error('Unggahan production memerlukan penyimpanan S3. Hubungi administrator untuk mengaktifkannya.');
  const buffer = await validasiGambar(file, options.minDimension ?? 800);
  const filename = `${randomUUID()}.webp`;
  if (driver === 's3') return simpanS3(`uploads/${filename}`, buffer);
  if (driver !== 'local') throw new Error('Driver penyimpanan gambar tidak didukung.');
  const directory = path.join(process.cwd(), 'public', 'uploads');
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, filename), buffer, { flag: 'wx' });
  return `/uploads/${filename}`;
}
