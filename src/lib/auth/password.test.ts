import { describe, expect, it } from 'vitest';
import { cocokkanPassword, cocokkanPasswordPalsu, hashPassword } from './password';

describe('password', () => {
  it('hash bcrypt tidak memuat password asli dan bisa dicocokkan', async () => {
    const hash = await hashPassword('rahasia123');
    expect(hash).toMatch(/^\$2[aby]\$10\$/);
    expect(hash).not.toContain('rahasia123');
    expect(await cocokkanPassword('rahasia123', hash)).toBe(true);
    expect(await cocokkanPassword('rahasia124', hash)).toBe(false);
  });

  it('dua hash untuk password sama berbeda (memakai salt)', async () => {
    expect(await hashPassword('rahasia123')).not.toBe(await hashPassword('rahasia123'));
  });

  it('hash rusak dianggap tidak cocok, bukan error', async () => {
    expect(await cocokkanPassword('rahasia123', 'bukan-hash')).toBe(false);
  });

  it('pencocokan palsu (email tidak terdaftar) memakan waktu seperti pencocokan asli', async () => {
    const hash = await hashPassword('rahasia123');
    const t0 = performance.now();
    await cocokkanPassword('salah', hash);
    const asli = performance.now() - t0;
    const t1 = performance.now();
    expect(await cocokkanPasswordPalsu('salah')).toBe(false);
    const palsu = performance.now() - t1;
    // Keduanya menjalankan bcrypt cost 10; selisihnya jauh di bawah waktu bcrypt itu sendiri
    expect(palsu).toBeGreaterThan(asli * 0.3);
  });
});
