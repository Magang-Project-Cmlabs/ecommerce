import 'server-only';
import { SignJWT, jwtVerify } from 'jose';
import { z } from 'zod';
import { kunciDariRahasia } from '@/lib/auth/token';
import { tokenUploadSchema, tujuanUploadSchema, type TujuanUpload } from '@/lib/validations/upload';

const ISSUER = 'tokokita-image-upload';
const AUDIENCE = 'tokokita-image-save';
const key = () => kunciDariRahasia(process.env.AUTH_SECRET);
const pesan = 'Unggahan tidak valid atau kedaluwarsa. Pilih dan unggah gambar kembali.';

function urlUploadSah(url: string) {
  if (/^\/uploads\/[0-9a-f-]{36}\.webp$/.test(url)) return true;
  const prefix = process.env.S3_PUBLIC_URL?.replace(/\/$/, '');
  return !!prefix && url.startsWith(`${prefix}/uploads/`) && /^[0-9a-f-]{36}\.webp$/.test(url.slice(`${prefix}/uploads/`.length));
}
export async function buatTokenGambar(url: string, userId: number, purpose: TujuanUpload) {
  tujuanUploadSchema.parse(purpose);
  if (!Number.isSafeInteger(userId) || userId < 1 || !urlUploadSah(url) || url.length > 255) throw new Error(pesan);
  return new SignJWT({ url, purpose }).setProtectedHeader({ alg: 'HS256' }).setIssuer(ISSUER).setAudience(AUDIENCE)
    .setSubject(String(userId)).setIssuedAt().setExpirationTime('1h').sign(key());
}
export async function verifikasiTokenGambar(tokens: string[], userId: number, purpose: TujuanUpload, maximum: number): Promise<string[]> {
  const valid = z.array(tokenUploadSchema).max(maximum).safeParse(tokens);
  if (!valid.success || new Set(tokens).size !== tokens.length) throw new Error(pesan);
  const urls: string[] = [];
  for (const token of tokens) {
    try {
      const { payload } = await jwtVerify(token, key(), { algorithms: ['HS256'], issuer: ISSUER, audience: AUDIENCE });
      if (payload.sub !== String(userId) || payload.purpose !== purpose || typeof payload.url !== 'string' || !urlUploadSah(payload.url) || !payload.exp) throw new Error(pesan);
      urls.push(payload.url);
    } catch { throw new Error(pesan); }
  }
  if (new Set(urls).size !== urls.length) throw new Error('Gambar tidak boleh berulang.');
  return urls;
}
