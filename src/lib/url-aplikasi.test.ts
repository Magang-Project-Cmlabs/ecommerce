import { describe, expect, it } from 'vitest';
import { urlAplikasi } from './url-aplikasi';

describe('urlAplikasi', () => {
  it('memakai APP_URL tanpa garis miring di akhir', () => {
    expect(urlAplikasi({ APP_URL: 'https://toko.contoh.id/', NODE_ENV: 'production' })).toBe('https://toko.contoh.id');
  });

  it('development tanpa APP_URL memakai localhost:3000', () => {
    expect(urlAplikasi({ NODE_ENV: 'development' })).toBe('http://localhost:3000');
  });

  it('production tanpa APP_URL gagal keras (link di email tidak boleh diambil dari header Host)', () => {
    expect(() => urlAplikasi({ APP_URL: '', NODE_ENV: 'production' })).toThrow(/APP_URL/);
  });

  it('menolak APP_URL yang bukan http(s)', () => {
    expect(() => urlAplikasi({ APP_URL: 'javascript:alert(1)', NODE_ENV: 'production' })).toThrow(/APP_URL/);
  });
});
