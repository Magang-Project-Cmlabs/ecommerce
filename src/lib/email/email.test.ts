import { describe, expect, it } from 'vitest';
import { modeKirim } from './mode';
import { emailResetPassword } from './templat';

describe('modeKirim (OPEN_DECISIONS D6)', () => {
  it('SMTP dipakai bila SMTP_HOST diisi', () => {
    expect(modeKirim({ SMTP_HOST: 'localhost', NODE_ENV: 'development' })).toBe('smtp');
    expect(modeKirim({ SMTP_HOST: 'smtp.contoh.id', NODE_ENV: 'production' })).toBe('smtp');
  });

  it('development tanpa SMTP mencetak email ke konsol', () => {
    expect(modeKirim({ SMTP_HOST: '', NODE_ENV: 'development' })).toBe('konsol');
    expect(modeKirim({ NODE_ENV: 'test' })).toBe('konsol');
  });

  it('production tanpa SMTP tidak pernah mencetak isi email (berisi link rahasia) ke log', () => {
    expect(modeKirim({ SMTP_HOST: '  ', NODE_ENV: 'production' })).toBe('tidak-dikonfigurasi');
  });
});

describe('emailResetPassword', () => {
  const url = 'https://toko.contoh.id/reset-password?token=abc_DEF-123';

  it('berisi link reset, masa berlaku 1 jam, dan saran bila tidak meminta', () => {
    const e = emailResetPassword({ nama: 'Budi', url });
    expect(e.subject).toBe('Atur ulang password TokoKita');
    for (const isi of [e.text, e.html]) {
      expect(isi).toContain(url);
      expect(isi).toContain('1 jam');
      expect(isi).toMatch(/abaikan email ini/i);
    }
  });

  it('nama pengguna di-escape di HTML (tidak bisa menyisipkan tag atau tautan)', () => {
    const e = emailResetPassword({ nama: '<a href="https://jahat.example">Klik</a>', url });
    expect(e.html).not.toContain('<a href="https://jahat.example">');
    expect(e.html).toContain('&lt;a href=&quot;https://jahat.example&quot;&gt;');
  });
});
