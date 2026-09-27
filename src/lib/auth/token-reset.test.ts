import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { MASA_TOKEN_RESET_MS, buatTokenReset, hashTokenReset, tokenResetBerbentukSah } from './token-reset';

describe('token reset password', () => {
  it('token acak 256 bit (base64url 43 karakter), yang disimpan hanya hash SHA-256 hex', () => {
    const { token, tokenHash } = buatTokenReset();
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(tokenHash).toMatch(/^[0-9a-f]{64}$/);
    expect(tokenHash).toBe(createHash('sha256').update(token).digest('hex'));
    expect(tokenHash).not.toContain(token);
  });

  it('setiap token berbeda', () => {
    const semua = new Set(Array.from({ length: 200 }, () => buatTokenReset().token));
    expect(semua.size).toBe(200);
  });

  it('hashTokenReset deterministik', () => {
    expect(hashTokenReset('abc')).toBe(hashTokenReset('abc'));
    expect(hashTokenReset('abc')).not.toBe(hashTokenReset('abd'));
  });

  it('berlaku 1 jam (PRD §10.9)', () => {
    expect(MASA_TOKEN_RESET_MS).toBe(60 * 60 * 1000);
  });

  it('tokenResetBerbentukSah hanya menerima bentuk token buatan server', () => {
    expect(tokenResetBerbentukSah(buatTokenReset().token)).toBe(true);
    for (const salah of [undefined, null, '', 'pendek', 'a'.repeat(44), `${'a'.repeat(42)}=`, `${'a'.repeat(42)}/`, ['x']]) {
      expect(tokenResetBerbentukSah(salah)).toBe(false);
    }
  });
});
