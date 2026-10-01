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

import { pilihUlasanBeranda, samarkanNama } from './beranda';

describe('samarkanNama', () => {
  it('menampilkan nama depan dan inisial belakang saja', () => {
    expect(samarkanNama('Budi Santoso')).toBe('Budi S.');
    expect(samarkanNama('  Citra   Dewi Lestari ')).toBe('Citra L.');
  });
  it('nama satu kata tetap utuh, kosong menjadi Pembeli', () => {
    expect(samarkanNama('Andi')).toBe('Andi');
    expect(samarkanNama('   ')).toBe('Pembeli');
  });
});

describe('pilihUlasanBeranda', () => {
  const u = (id: number, productId: number, rating: number, content: string, name = 'Rina Putri') =>
    ({ id, productId, rating, content, userName: name, productName: `Produk ${productId}`, productSlug: `p-${productId}` });
  const panjang = 'Barangnya bagus, sesuai deskripsi dan pengiriman cepat sekali.';

  it('hanya rating 4 ke atas dengan tulisan cukup panjang', () => {
    const hasil = pilihUlasanBeranda([u(1, 1, 3, panjang), u(2, 2, 5, 'Bagus'), u(3, 3, 5, panjang)], 3);
    expect(hasil.map((x) => x.id)).toEqual([3]);
  });
  it('satu ulasan per produk dan dibatasi jumlahnya', () => {
    const hasil = pilihUlasanBeranda([u(1, 1, 5, panjang), u(2, 1, 5, panjang), u(3, 2, 4, panjang), u(4, 3, 5, panjang), u(5, 4, 5, panjang)], 3);
    expect(hasil.map((x) => x.id)).toEqual([1, 3, 4]);
  });
  it('nama pembeli disamarkan dan isi dipangkas rapi', () => {
    const [satu] = pilihUlasanBeranda([u(1, 1, 5, `${panjang} ${'x'.repeat(400)}`, 'Rina Putri')], 1);
    expect(satu!.nama).toBe('Rina P.');
    expect(satu!.isi.length).toBeLessThanOrEqual(221);
  });
});
