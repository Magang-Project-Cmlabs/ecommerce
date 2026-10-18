import { describe, expect, it } from 'vitest';
import { susunAksi, uraiPenanda, type ProdukAksiDb } from './aksi';

const kaos: ProdukAksiDb = {
  id: 1, slug: 'kaos-polos-premium', name: 'Kaos Polos Premium', image: '/kaos.webp', price: 89000, compareAtPrice: 129000,
  stock: 60, isPreorder: false, variantLabel: 'Ukuran', rating: 4.9, reviewCount: 47,
  variants: [{ id: 11, name: 'S', price: null, stock: 0 }, { id: 12, name: 'M', price: null, stock: 20 }, { id: 13, name: 'XL', price: 99000, stock: 3 }],
};
const lampu: ProdukAksiDb = {
  id: 2, slug: 'lampu-pintar', name: 'Lampu Pintar', image: null, price: 119000, compareAtPrice: null,
  stock: 5, isPreorder: false, variantLabel: null, rating: 0, reviewCount: 0, variants: [],
};
const habis: ProdukAksiDb = { ...lampu, id: 3, slug: 'botol-habis', name: 'Botol Habis', stock: 0 };

describe('uraiPenanda', () => {
  it('mengambil penanda produk dan membuangnya dari teks', () => {
    const hasil = uraiPenanda('Ini pilihan untuk lari:\n- Sepatu A — Rp 450.000\n[[produk:sepatu-a]]\n[[produk:sepatu-b]]\nSemoga cocok!');
    expect(hasil.penanda).toEqual([{ jenis: 'produk', slug: 'sepatu-a', tambah: false }, { jenis: 'produk', slug: 'sepatu-b', tambah: false }]);
    expect(hasil.teks).toBe('Ini pilihan untuk lari:\n- Sepatu A — Rp 450.000\nSemoga cocok!');
  });

  it('memahami penanda keranjang dengan varian dan jumlah', () => {
    expect(uraiPenanda('[[keranjang:kaos-polos-premium|M|2]]').penanda).toEqual([{ jenis: 'produk', slug: 'kaos-polos-premium', tambah: true, varian: 'M', jumlah: 2 }]);
    expect(uraiPenanda('[[keranjang:lampu-pintar|-|1]]').penanda).toEqual([{ jenis: 'produk', slug: 'lampu-pintar', tambah: true, jumlah: 1 }]);
    expect(uraiPenanda('[[keranjang:lampu-pintar]]').penanda).toEqual([{ jenis: 'produk', slug: 'lampu-pintar', tambah: true }]);
  });

  it('penanda keranjang menggantikan penanda produk yang sama, maksimal 4 produk', () => {
    const teks = '[[produk:a]] [[produk:b]] [[keranjang:a|-|3]] [[produk:c]] [[produk:d]] [[produk:e]]';
    expect(uraiPenanda(teks).penanda.map((p) => p.jenis === 'produk' && `${p.slug}:${p.tambah}`)).toEqual(['a:true', 'b:false', 'c:false', 'd:false']);
  });

  it('mengenali checkout, kurir, dan pembayaran; kode tak dikenal dibuang', () => {
    expect(uraiPenanda('Siap! [[checkout]] [[kurir:jne_reg]] [[bayar:qris]] [[kurir:pos_kilat]] [[bayar:kartu_kredit]]').penanda)
      .toEqual([{ jenis: 'checkout' }, { jenis: 'kurir', kode: 'jne_reg' }, { jenis: 'bayar', kode: 'qris' }]);
  });

  it('mengurai alamat menjadi kolom yang dikenal saja', () => {
    const { penanda, teks } = uraiPenanda('Saya siapkan alamatnya.\n[[alamat|nama=Budi Santoso|hp=NOMOR_HP_1|jalan=Jl. Melati No. 5 RT 01/RW 02|kecamatan=Coblong|kota=Bandung|provinsi=Jawa Barat|kodepos=40132|rahasia=x]]');
    expect(teks).toBe('Saya siapkan alamatnya.');
    expect(penanda).toEqual([{ jenis: 'alamat', isian: { name: 'Budi Santoso', phone: 'NOMOR_HP_1', street: 'Jl. Melati No. 5 RT 01/RW 02', district: 'Coblong', city: 'Bandung', province: 'Jawa Barat', postalCode: '40132' } }]);
  });

  it('mengabaikan penanda tak dikenal atau slug tidak sah, tetap membuangnya dari teks', () => {
    const hasil = uraiPenanda('Halo [[hapus:semua]] [[produk:../../etc]] dunia');
    expect(hasil.penanda).toEqual([]);
    expect(hasil.teks).toBe('Halo dunia');
  });

  it('teks tanpa penanda tidak berubah selain dirapikan', () => {
    expect(uraiPenanda('  Halo!\n\n\n\nAda yang bisa dibantu?  ').teks).toBe('Halo!\n\nAda yang bisa dibantu?');
  });
});

describe('susunAksi', () => {
  const db = [kaos, lampu, habis];

  it('produk direkam dari database, bukan dari model', () => {
    const [aksi] = susunAksi([{ jenis: 'produk', slug: 'kaos-polos-premium', tambah: false }], db);
    expect(aksi).toMatchObject({ jenis: 'produk', tambah: false, varianId: null, jumlah: 1, produk: { id: 1, name: 'Kaos Polos Premium', price: 89000, stokAda: true } });
    expect(aksi?.jenis === 'produk' && aksi.produk.varian).toEqual([
      { id: 11, name: 'S', price: 89000, stokAda: false }, { id: 12, name: 'M', price: 89000, stokAda: true }, { id: 13, name: 'XL', price: 99000, stokAda: true },
    ]);
  });

  it('produk yang tidak ada di database dibuang', () => {
    expect(susunAksi([{ jenis: 'produk', slug: 'tidak-ada', tambah: true }], db)).toEqual([]);
  });

  it('varian dicocokkan tanpa peduli huruf besar; varian habis atau salah tidak dipilih', () => {
    const pilih = (varian: string) => { const [a] = susunAksi([{ jenis: 'produk', slug: 'kaos-polos-premium', tambah: true, varian }], db); return a?.jenis === 'produk' ? a.varianId : undefined; };
    expect(pilih('m')).toBe(12);
    expect(pilih('S')).toBeNull();
    expect(pilih('XXL')).toBeNull();
  });

  it('jumlah dibatasi 1 sampai stok (maksimal 99)', () => {
    const jumlah = (j: number, slug = 'lampu-pintar', varian?: string) => { const [a] = susunAksi([{ jenis: 'produk', slug, tambah: true, jumlah: j, varian }], db); return a?.jenis === 'produk' ? a.jumlah : undefined; };
    expect(jumlah(0)).toBe(1);
    expect(jumlah(500)).toBe(5);
    expect(jumlah(9, 'kaos-polos-premium', 'XL')).toBe(3);
    expect(jumlah(4, 'botol-habis')).toBe(1);
  });

  it('kurir dan pembayaran diberi label tetap', () => {
    expect(susunAksi([{ jenis: 'kurir', kode: 'sicepat_reg' }, { jenis: 'bayar', kode: 'cod' }, { jenis: 'checkout' }], db)).toEqual([
      { jenis: 'kurir', kode: 'sicepat_reg', label: 'SiCepat REG' }, { jenis: 'bayar', kode: 'cod', label: 'Bayar di Tempat (COD)' }, { jenis: 'checkout' },
    ]);
  });

  it('alamat: provinsi dibakukan, kolom tidak sah dibuang, kolom kurang disebutkan', () => {
    const [aksi] = susunAksi([{ jenis: 'alamat', isian: { name: 'Budi', phone: 'NOMOR_HP_1', province: 'Atlantis', postalCode: '4013', city: 'Bandung' } }], db);
    expect(aksi).toEqual({ jenis: 'alamat', data: { name: 'Budi', phone: 'NOMOR_HP_1', city: 'Bandung' }, kurang: ['Alamat lengkap', 'Kecamatan', 'Provinsi', 'Kode pos'] });
    const [baku] = susunAksi([{ jenis: 'alamat', isian: { province: 'jabar', postalCode: '40132' } }], db);
    expect(baku?.jenis === 'alamat' && baku.data).toEqual({ province: 'Jawa Barat', postalCode: '40132' });
  });

  it('alamat: nomor HP hanya diterima sebagai token samaran', () => {
    const hp = (phone: string) => { const [a] = susunAksi([{ jenis: 'alamat', isian: { name: 'Budi', phone } }], db); return a?.jenis === 'alamat' ? a.data.phone : undefined; };
    expect(hp('NOMOR_HP_2')).toBe('NOMOR_HP_2');
    // Nomor mentah dari model ditolak: hanya token yang dijamin berasal dari pembeli.
    expect(hp('0812-3456-7890')).toBeUndefined();
    expect(hp('telepon saya')).toBeUndefined();
  });

  it('alamat tanpa satu pun kolom sah dibuang', () => {
    expect(susunAksi([{ jenis: 'alamat', isian: { postalCode: 'abc' } }], db)).toEqual([]);
  });
});
