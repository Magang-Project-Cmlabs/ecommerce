import { describe, expect, it } from 'vitest';
import { bagiTanpaDuplikat } from './beranda';

const p = (...ids: number[]) => ids.map((id) => ({ id }));

describe('bagiTanpaDuplikat', () => {
  it('produk yang sudah tampil di bagian sebelumnya tidak diulang', () => {
    const hasil = bagiTanpaDuplikat([
      { kunci: 'populer', calon: p(1, 2, 3), batas: 2 },
      { kunci: 'unggulan', calon: p(1, 2, 4, 5), batas: 2 },
      { kunci: 'diskon', calon: p(4, 6), batas: 2 },
    ]);
    expect(hasil.populer!.map((x) => x.id)).toEqual([1, 2]);
    expect(hasil.unggulan!.map((x) => x.id)).toEqual([4, 5]);
    expect(hasil.diskon!.map((x) => x.id)).toEqual([6]);
  });

  it('calon yang tidak terpilih karena batas tetap boleh muncul di bagian berikutnya', () => {
    const hasil = bagiTanpaDuplikat([
      { kunci: 'a', calon: p(1, 2, 3), batas: 1 },
      { kunci: 'b', calon: p(2, 3), batas: 2 },
    ]);
    expect(hasil.b!.map((x) => x.id)).toEqual([2, 3]);
  });

  it('bagian tanpa sisa produk menghasilkan daftar kosong', () => {
    const hasil = bagiTanpaDuplikat([{ kunci: 'a', calon: p(1), batas: 4 }, { kunci: 'b', calon: p(1), batas: 4 }]);
    expect(hasil.b).toEqual([]);
  });
});
