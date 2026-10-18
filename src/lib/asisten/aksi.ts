// Aksi asisten belanja (D23). Model tetap hanya membalas teks (D18, tanpa `tools`), tetapi boleh
// menyisipkan penanda seperti [[produk:slug]]. Modul murni ini mengurai penanda itu lalu
// mencocokkannya dengan data dari database. Hasilnya hanya usulan: tombol di panel baru
// berjalan setelah pembeli menekannya. Harga, stok, dan varian selalu dari database, bukan model.

import { TARIF_KURIR, type KurirKode } from '@/lib/pesanan/ongkir';
import { provinsiBaku } from '@/lib/pesanan/wilayah';

export type MetodeBayarAsisten = 'qris' | 'bank_bca' | 'bank_mandiri' | 'cod';
export const LABEL_BAYAR: Record<MetodeBayarAsisten, string> = {
  qris: 'QRIS', bank_bca: 'Transfer Bank BCA', bank_mandiri: 'Transfer Bank Mandiri', cod: 'Bayar di Tempat (COD)',
};

export type KolomAlamat = 'label' | 'name' | 'phone' | 'street' | 'district' | 'city' | 'province' | 'postalCode';
export type DrafAlamat = Partial<Record<KolomAlamat, string>>;

export type Penanda =
  | { jenis: 'produk'; slug: string; tambah: boolean; varian?: string; jumlah?: number }
  | { jenis: 'checkout' }
  | { jenis: 'kurir'; kode: KurirKode }
  | { jenis: 'bayar'; kode: MetodeBayarAsisten }
  | { jenis: 'alamat'; isian: DrafAlamat };

export type ProdukAksiDb = {
  id: number; slug: string; name: string; image: string | null; price: number; compareAtPrice: number | null;
  stock: number; isPreorder: boolean; variantLabel: string | null; rating: number; reviewCount: number;
  variants: { id: number; name: string; price: number | null; stock: number }[];
};

export type KartuProdukAsisten = {
  id: number; slug: string; name: string; image: string | null; price: number; compareAtPrice: number | null;
  rating: number; reviewCount: number; isPreorder: boolean; stokAda: boolean; variantLabel: string | null;
  varian: { id: number; name: string; price: number; stokAda: boolean }[];
};

export type AksiAsisten =
  | { jenis: 'produk'; tambah: boolean; produk: KartuProdukAsisten; varianId: number | null; jumlah: number }
  | { jenis: 'checkout' }
  | { jenis: 'kurir'; kode: KurirKode; label: string }
  | { jenis: 'bayar'; kode: MetodeBayarAsisten; label: string }
  | { jenis: 'alamat'; data: DrafAlamat; kurang: string[] };

export const MAKS_KARTU_PRODUK = 4;
const MAKS_KUANTITAS = 99;
export const POLA_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
// Token pengganti nomor HP (lihat telepon.ts): model tidak pernah melihat nomor aslinya.
export const POLA_TOKEN_HP = /^NOMOR_HP_\d{1,2}$/;
const POLA_PENANDA = /\[\[\s*([a-z]+)\s*(?:[:|]([^\]\n]*))?\]\]/gi;

const KOLOM_PENANDA: Record<string, KolomAlamat> = {
  label: 'label', nama: 'name', hp: 'phone', telepon: 'phone', jalan: 'street', alamat: 'street',
  kecamatan: 'district', kota: 'city', kabupaten: 'city', provinsi: 'province', kodepos: 'postalCode',
};
const LABEL_KOLOM: [KolomAlamat, string][] = [
  ['name', 'Nama penerima'], ['phone', 'Nomor HP'], ['street', 'Alamat lengkap'], ['district', 'Kecamatan'],
  ['city', 'Kota/Kabupaten'], ['province', 'Provinsi'], ['postalCode', 'Kode pos'],
];
const BATAS_KOLOM: Record<KolomAlamat, number> = { label: 50, name: 100, phone: 20, street: 255, district: 100, city: 100, province: 100, postalCode: 5 };

const adalahKurir = (k: string): k is KurirKode => Object.hasOwn(TARIF_KURIR, k);
const adalahBayar = (k: string): k is MetodeBayarAsisten => Object.hasOwn(LABEL_BAYAR, k);

function penandaProduk(isi: string, tambah: boolean): Penanda | null {
  const [slug = '', varian = '', jumlah = ''] = isi.split('|').map((s) => s.trim());
  if (!POLA_SLUG.test(slug) || slug.length > 220) return null;
  const p: Penanda = { jenis: 'produk', slug, tambah };
  if (varian && varian !== '-') p.varian = varian.slice(0, 50);
  const n = Number.parseInt(jumlah, 10);
  if (Number.isFinite(n)) p.jumlah = n;
  return p;
}

function penandaAlamat(isi: string): Penanda | null {
  const isian: DrafAlamat = {};
  for (const bagian of isi.split('|')) {
    const sama = bagian.indexOf('=');
    if (sama < 1) continue;
    const kolom = KOLOM_PENANDA[bagian.slice(0, sama).trim().toLowerCase().replace(/[\s_-]/g, '')];
    const nilai = bagian.slice(sama + 1).trim();
    if (kolom && nilai) isian[kolom] = nilai;
  }
  return Object.keys(isian).length ? { jenis: 'alamat', isian } : null;
}

function bacaSatu(jenis: string, isi: string): Penanda | null {
  const kode = isi.trim();
  switch (jenis) {
    case 'produk': return penandaProduk(isi, false);
    case 'keranjang': return penandaProduk(isi, true);
    case 'checkout': return { jenis: 'checkout' };
    case 'kurir': return adalahKurir(kode) ? { jenis: 'kurir', kode } : null;
    case 'bayar': return adalahBayar(kode) ? { jenis: 'bayar', kode } : null;
    case 'alamat': return penandaAlamat(isi);
    default: return null;
  }
}

/** Satu penanda per jenis (produk: satu per slug, maksimal 4); keranjang menang atas produk biasa. */
function gabung(daftar: Penanda[], baru: Penanda): void {
  if (baru.jenis !== 'produk') {
    const i = daftar.findIndex((p) => p.jenis === baru.jenis);
    if (i === -1) daftar.push(baru); else if (baru.jenis === 'alamat') daftar[i] = baru;
    return;
  }
  const i = daftar.findIndex((p) => p.jenis === 'produk' && p.slug === baru.slug);
  if (i !== -1) { if (baru.tambah) daftar[i] = baru; return; }
  if (daftar.filter((p) => p.jenis === 'produk').length < MAKS_KARTU_PRODUK) daftar.push(baru);
}

/** Pisahkan teks jawaban dari penanda aksi. Penanda yang tidak dikenal tetap dibuang dari teks. */
export function uraiPenanda(jawaban: string): { teks: string; penanda: Penanda[] } {
  const penanda: Penanda[] = [];
  const baris = jawaban.split('\n').flatMap((asli) => {
    const sisa = asli.replace(POLA_PENANDA, (_, jenis: string, isi = '') => {
      const p = bacaSatu(jenis.toLowerCase(), isi);
      if (p) gabung(penanda, p);
      return '';
    });
    // Baris yang isinya hanya penanda (atau penanda dalam butir daftar) dihapus seluruhnya.
    if (sisa !== asli && /^\s*(?:[-*•]\s*)?$/.test(sisa)) return [];
    return [sisa.replace(/[ \t]{2,}/g, ' ').trimEnd()];
  });
  return { teks: baris.join('\n').replace(/\n{3,}/g, '\n\n').trim(), penanda };
}

function kartu(p: ProdukAksiDb): KartuProdukAsisten {
  const varian = p.variants.map((v) => ({ id: v.id, name: v.name, price: v.price ?? p.price, stokAda: v.stock > 0 || p.isPreorder }));
  return {
    id: p.id, slug: p.slug, name: p.name, image: p.image, price: p.price, compareAtPrice: p.compareAtPrice,
    rating: p.rating, reviewCount: p.reviewCount, isPreorder: p.isPreorder, variantLabel: p.variantLabel, varian,
    stokAda: p.isPreorder || (varian.length ? varian.some((v) => v.stokAda) : p.stock > 0),
  };
}

function aksiProduk(penanda: Extract<Penanda, { jenis: 'produk' }>, p: ProdukAksiDb): AksiAsisten {
  const dicari = penanda.varian?.toLowerCase();
  const varian = dicari ? p.variants.find((v) => v.name.toLowerCase() === dicari && (v.stock > 0 || p.isPreorder)) : undefined;
  const stok = p.isPreorder ? MAKS_KUANTITAS : (varian ? varian.stock : p.stock);
  const jumlah = Math.min(Math.max(Math.floor(penanda.jumlah ?? 1), 1), Math.max(1, Math.min(stok, MAKS_KUANTITAS)));
  return { jenis: 'produk', tambah: penanda.tambah, produk: kartu(p), varianId: varian?.id ?? null, jumlah };
}

function bersihkanKolom(kolom: KolomAlamat, nilai: string): string | null {
  const v = nilai.replace(/[<>{}]/g, '').replace(/\s+/g, ' ').trim();
  if (!v) return null;
  // Nomor HP hanya diterima sebagai token: angka mentah dari model bisa karangan.
  if (kolom === 'phone') return POLA_TOKEN_HP.test(v) ? v : null;
  if (kolom === 'province') return provinsiBaku(v);
  if (kolom === 'postalCode') return /^\d{5}$/.test(v) ? v : null;
  return v.slice(0, BATAS_KOLOM[kolom]);
}

function aksiAlamat(isian: DrafAlamat): AksiAsisten | null {
  const data: DrafAlamat = {};
  for (const [kolom, nilai] of Object.entries(isian) as [KolomAlamat, string][]) {
    const bersih = bersihkanKolom(kolom, nilai);
    if (bersih) data[kolom] = bersih;
  }
  if (!Object.keys(data).length) return null;
  return { jenis: 'alamat', data, kurang: LABEL_KOLOM.filter(([k]) => !data[k]).map(([, label]) => label) };
}

/** Ubah penanda menjadi aksi siap tampil memakai baris produk dari database. */
export function susunAksi(penanda: Penanda[], produk: ProdukAksiDb[]): AksiAsisten[] {
  const perSlug = new Map(produk.map((p) => [p.slug, p]));
  return penanda.flatMap((p): AksiAsisten[] => {
    switch (p.jenis) {
      case 'produk': { const db = perSlug.get(p.slug); return db ? [aksiProduk(p, db)] : []; }
      case 'kurir': return [{ jenis: 'kurir', kode: p.kode, label: TARIF_KURIR[p.kode].label }];
      case 'bayar': return [{ jenis: 'bayar', kode: p.kode, label: LABEL_BAYAR[p.kode] }];
      case 'alamat': { const a = aksiAlamat(p.isian); return a ? [a] : []; }
      default: return [p];
    }
  });
}

/** Slug produk yang perlu dibaca dari database untuk sekumpulan penanda. */
export const slugPenanda = (penanda: Penanda[]): string[] => penanda.flatMap((p) => (p.jenis === 'produk' ? [p.slug] : []));
