import bcrypt from 'bcryptjs';
import { describe, expect, it } from 'vitest';
import { cocokkanPassword, cocokkanPasswordPalsu, hashPassword, perluHashUlang } from './password';

describe('password', () => {
  it('hash argon2id tidak memuat password asli dan bisa dicocokkan', async () => {
    const hash = await hashPassword('rahasia123');
    expect(hash).toMatch(/^\$argon2id\$v=19\$m=19456,t=2,p=1\$/);
    expect(hash).not.toContain('rahasia123');
    expect(await cocokkanPassword('rahasia123', hash)).toBe(true);
    expect(await cocokkanPassword('rahasia124', hash)).toBe(false);
  });

  it('dua hash untuk password sama berbeda (memakai salt)', async () => {
    expect(await hashPassword('rahasia123')).not.toBe(await hashPassword('rahasia123'));
  });

  it('hash rusak dianggap tidak cocok, bukan error', async () => {
    expect(await cocokkanPassword('rahasia123', 'bukan-hash')).toBe(false);
    expect(await cocokkanPassword('rahasia123', '$argon2id$rusak')).toBe(false);
  });

  it('hash bcrypt lama tetap bisa dipakai masuk dan ditandai perlu di-hash ulang', async () => {
    const lama = await bcrypt.hash('rahasia123', 10);
    expect(await cocokkanPassword('rahasia123', lama)).toBe(true);
    expect(await cocokkanPassword('salah12345', lama)).toBe(false);
    expect(perluHashUlang(lama)).toBe(true);
    expect(perluHashUlang(await hashPassword('rahasia123'))).toBe(false);
  });

  it('hash argon2 dengan parameter lebih lemah ditandai perlu di-hash ulang', () => {
    expect(perluHashUlang('$argon2id$v=19$m=4096,t=3,p=1$c2FsdHNhbHQ$aGFzaGhhc2g')).toBe(true);
    expect(perluHashUlang('$argon2i$v=19$m=19456,t=2,p=1$c2FsdHNhbHQ$aGFzaGhhc2g')).toBe(true);
  });

  it('pencocokan palsu (email tidak terdaftar) memakan waktu seperti pencocokan asli', async () => {
    const hash = await hashPassword('rahasia123');
    await cocokkanPasswordPalsu('pemanasan');
    const t0 = performance.now();
    await cocokkanPassword('salah', hash);
    const asli = performance.now() - t0;
    const t1 = performance.now();
    expect(await cocokkanPasswordPalsu('salah')).toBe(false);
    const palsu = performance.now() - t1;
    // Keduanya menjalankan argon2id dengan parameter sama; selisihnya jauh di bawah waktu hash itu sendiri.
    expect(palsu).toBeGreaterThan(asli * 0.3);
  });
});
