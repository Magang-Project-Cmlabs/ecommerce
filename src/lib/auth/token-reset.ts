// Token reset password (PRD §10.9, §13): 32 byte acak dikirim lewat email,
// database hanya menyimpan SHA-256-nya. Hash tanpa garam cukup karena token
// berentropi 256 bit (tidak bisa ditebak lewat kamus seperti password).

import { createHash, randomBytes } from 'node:crypto';

export const MASA_TOKEN_RESET_MS = 60 * 60 * 1000;

export function hashTokenReset(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function buatTokenReset(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString('base64url');
  return { token, tokenHash: hashTokenReset(token) };
}

/** Bentuk token buatan buatTokenReset(): base64url tanpa padding, 43 karakter. */
export function tokenResetBerbentukSah(nilai: unknown): nilai is string {
  return typeof nilai === 'string' && /^[A-Za-z0-9_-]{43}$/.test(nilai);
}
