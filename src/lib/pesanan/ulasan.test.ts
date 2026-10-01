import { describe, expect, it } from 'vitest';
import { bolehMengulas } from './ulasan';

const sekarang = new Date('2026-10-01T00:00:00Z');
const dasar = { userId: 2, pemilikId: 2, status: 'delivered', deliveredAt: sekarang, sudahDiulas: false };
describe('izin ulasan PRD §10.7', () => {
  it('mengizinkan pemilik setelah delivered', () => expect(bolehMengulas(dasar, sekarang)).toBeNull());
  it('menolak bukan pemilik', () => expect(bolehMengulas({ ...dasar, userId: 3 }, sekarang)).toBeTruthy());
  it.each(['pending', 'confirmed', 'packed', 'shipped', 'cancelled'])('menolak %s', (status) => expect(bolehMengulas({ ...dasar, status }, sekarang)).toBeTruthy());
  it('menolak duplikasi', () => expect(bolehMengulas({ ...dasar, sudahDiulas: true }, sekarang)).toBeTruthy());
  it('menolak tanpa tanggal selesai', () => expect(bolehMengulas({ ...dasar, deliveredAt: null }, sekarang)).toBeTruthy());
  it('tepat 30 hari boleh, lewat 1ms tidak', () => {
    const batas = new Date(sekarang.getTime() - 30 * 86400000);
    expect(bolehMengulas({ ...dasar, deliveredAt: batas }, sekarang)).toBeNull();
    expect(bolehMengulas({ ...dasar, deliveredAt: new Date(batas.getTime() - 1) }, sekarang)).toBeTruthy();
  });
  it('tanggal selesai di masa depan tidak sah', () => expect(bolehMengulas({ ...dasar, deliveredAt: new Date(sekarang.getTime() + 1) }, sekarang)).toBeTruthy());
});
