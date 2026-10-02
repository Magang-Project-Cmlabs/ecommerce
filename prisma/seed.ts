// Data demo TokoKita — PRD §20.
//
// Jalankan lewat `npm run db:reset` (reset -> generate -> seed) atau
// `npm run db:seed`. Aman diulang: semua data dihapus dulu, lalu diisi ulang
// dengan hasil yang sama (acak deterministik).
//
// Angka pesanan mengikuti aturan PRD: harga & berat dari produk/varian
// (§9), ongkir per kg (§10.3), promo (§10.4), nomor INV-YYYYMM-0001 per bulan
// (§10.5), dan urutan status (§10.6). Ulasan hanya dari item pesanan
// berstatus delivered (§10.7), sehingga seed juga membuat 12 pembeli contoh.

import "dotenv/config";
import { existsSync } from "node:fs";
import path from "node:path";
import { hash, type Algorithm } from "@node-rs/argon2";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../src/generated/prisma/client";
import { konfigurasiDb } from "../src/lib/konfigurasi-db";

if (process.env.NODE_ENV === "production") {
  throw new Error("Seed demo tidak boleh dijalankan di production (PRD §20, runbooks/deployment.md).");
}

const prisma = new PrismaClient({ adapter: new PrismaMariaDb(konfigurasiDb(process.env)) });

// ---------------------------------------------------------------------------
// Utilitas

/** PRNG deterministik (mulberry32) agar data demo sama setiap kali. */
function buatAcak(benih: number) {
  let a = benih >>> 0;
  const acak = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const antara = (min: number, max: number) => min + Math.floor(acak() * (max - min + 1));
  const pilih = <T>(daftar: readonly T[]): T => daftar[Math.floor(acak() * daftar.length)]!;
  const kocok = <T>(daftar: readonly T[]): T[] => {
    const salinan = [...daftar];
    for (let i = salinan.length - 1; i > 0; i--) {
      const j = Math.floor(acak() * (i + 1));
      [salinan[i], salinan[j]] = [salinan[j]!, salinan[i]!];
    }
    return salinan;
  };
  return { acak, antara, pilih, kocok };
}
const rng = buatAcak(20260927);

const SEKARANG = new Date();
const JAM = 60 * 60 * 1000;
const HARI = 24 * JAM;
const lalu = (hari: number, jam = 0) => new Date(SEKARANG.getTime() - hari * HARI - jam * JAM);
const tambah = (waktu: Date, jam: number) => new Date(waktu.getTime() + jam * JAM);

const slugify = (teks: string) =>
  teks
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const gambar = (kunci: string, i: number) => {
  const local = `/demo/tokokita-${kunci}-${i}.webp`;
  return existsSync(path.join(process.cwd(), 'public', local)) ? local : `https://picsum.photos/seed/tokokita-${kunci}-${i}/800/800`;
};

// ---------------------------------------------------------------------------
// Aturan bisnis yang dipakai seed (PRD §10.3-10.4). Modul resmi di src/lib/
// (kartu A4) wajib menghasilkan angka yang sama.

const KOTA_TOKO = (process.env.STORE_CITY || "Jakarta").trim().toLowerCase();

type Kurir = "jne_reg" | "sicepat_reg" | "gosend_instant";
type Metode = "qris" | "bank_bca" | "bank_mandiri" | "cod";

function hitungOngkir(kurir: Kurir, beratGram: number): number {
  const kg = Math.max(1, Math.ceil(beratGram / 1000));
  if (kurir === "jne_reg") return 15_000 * kg;
  if (kurir === "sicepat_reg") return 13_000 * kg;
  return 30_000;
}
const gosendBoleh = (kota: string, beratGram: number) => kota.trim().toLowerCase() === KOTA_TOKO && beratGram <= 20_000;

type Promo = {
  code: string;
  description: string;
  type: "PERCENT" | "FIXED";
  value: number;
  minSubtotal: number;
  maxDiscount: number | null;
  perUserLimit: number;
};
const PROMO: Promo[] = [
  { code: "HEMAT10", description: "Hemat 10% hingga Rp 50.000", type: "PERCENT", value: 10, minSubtotal: 100_000, maxDiscount: 50_000, perUserLimit: 1 },
  { code: "ONGKIRFREE", description: "Potongan Rp 20.000 untuk belanja min. Rp 150.000", type: "FIXED", value: 20_000, minSubtotal: 150_000, maxDiscount: null, perUserLimit: 3 },
  { code: "BELANJA50", description: "Potongan Rp 50.000 untuk belanja min. Rp 500.000", type: "FIXED", value: 50_000, minSubtotal: 500_000, maxDiscount: null, perUserLimit: 1 },
];
function hitungDiskon(kode: string | null, subtotal: number): number {
  if (!kode) return 0;
  const p = PROMO.find((x) => x.code === kode)!;
  if (subtotal < p.minSubtotal) throw new Error(`Seed: ${kode} dipakai di bawah minimal belanja`);
  let d = p.type === "PERCENT" ? Math.floor((subtotal * p.value) / 100) : p.value;
  if (p.maxDiscount !== null) d = Math.min(d, p.maxDiscount);
  return Math.min(d, subtotal);
}

// ---------------------------------------------------------------------------
// Katalog

const KATEGORI: { nama: string; sub: string[] }[] = [
  { nama: "Fashion Pria", sub: ["Kaos Pria", "Kemeja Pria", "Celana Pria"] },
  { nama: "Fashion Wanita", sub: ["Blouse", "Dress", "Rok"] },
  { nama: "Elektronik", sub: ["Audio", "Aksesoris Gadget", "Perangkat Rumah Pintar"] },
  { nama: "Rumah Tangga", sub: ["Peralatan Dapur", "Dekorasi"] },
  { nama: "Kecantikan", sub: ["Perawatan Wajah", "Perawatan Rambut"] },
  { nama: "Olahraga", sub: ["Sepatu Olahraga", "Perlengkapan Gym"] },
];

type VarianSeed = { nama: string; stok: number; harga?: number; berat?: number };
type ProdukSeed = {
  nama: string;
  merek: string;
  sub: string;
  harga: number;
  hargaCoret?: number;
  berat: number;
  labelVarian?: string;
  varian?: VarianSeed[];
  stok?: number; // produk tanpa varian
  preorder?: boolean;
  unggulan?: boolean;
  deskripsi: string;
  spesifikasi: Record<string, string>;
  tag: string[];
};

const uk = (nama: string[], stok: number[]): VarianSeed[] => nama.map((n, i) => ({ nama: n, stok: stok[i] ?? 0 }));

const PRODUK: ProdukSeed[] = [
  // Fashion Pria
  { nama: "Kaos Polos Premium", merek: "Kalemo", sub: "Kaos Pria", harga: 89_000, hargaCoret: 129_000, berat: 200, labelVarian: "Ukuran", varian: uk(["S", "M", "L", "XL"], [12, 20, 15, 0]), unggulan: true, deskripsi: "Kaos katun combed 30s yang adem dan tidak mudah melar. Cocok dipakai harian maupun dilapis kemeja.", spesifikasi: { Bahan: "Katun combed 30s", Potongan: "Regular fit", Perawatan: "Cuci dengan air dingin" }, tag: ["kaos", "katun", "basic"] },
  { nama: "Kaos Grafis Nusantara", merek: "Kalemo", sub: "Kaos Pria", harga: 99_000, berat: 210, labelVarian: "Ukuran", varian: uk(["S", "M", "L", "XL"], [8, 10, 6, 4]), deskripsi: "Kaos bergambar motif nusantara dengan sablon plastisol yang awet.", spesifikasi: { Bahan: "Katun combed 24s", Sablon: "Plastisol", Potongan: "Regular fit" }, tag: ["kaos", "grafis"] },
  { nama: "Kemeja Flanel Kotak", merek: "Rimba Co", sub: "Kemeja Pria", harga: 189_000, hargaCoret: 229_000, berat: 350, labelVarian: "Ukuran", varian: uk(["M", "L", "XL"], [5, 7, 3]), deskripsi: "Kemeja flanel tebal bermotif kotak, hangat untuk cuaca sejuk dan perjalanan.", spesifikasi: { Bahan: "Flanel katun", Lengan: "Panjang", Kancing: "Resin" }, tag: ["kemeja", "flanel"] },
  { nama: "Kemeja Linen Santai", merek: "Rimba Co", sub: "Kemeja Pria", harga: 219_000, berat: 300, labelVarian: "Ukuran", varian: uk(["M", "L", "XL"], [0, 0, 0]), deskripsi: "Kemeja linen ringan dengan kerah mandarin, nyaman untuk iklim tropis.", spesifikasi: { Bahan: "Linen campuran", Kerah: "Mandarin", Lengan: "Pendek" }, tag: ["kemeja", "linen"] },
  { nama: "Celana Chino Slim", merek: "Denimo", sub: "Celana Pria", harga: 149_000, hargaCoret: 199_000, berat: 450, labelVarian: "Ukuran", varian: uk(["29", "30", "31", "32", "33", "34"], [4, 6, 8, 5, 3, 2]), unggulan: true, deskripsi: "Celana chino stretch potongan slim, rapi untuk kerja dan tetap nyaman dipakai seharian.", spesifikasi: { Bahan: "Katun twill stretch", Potongan: "Slim fit", Kantong: "4" }, tag: ["celana", "chino"] },
  // Fashion Wanita
  { nama: "Blouse Katun Lengan Balon", merek: "Sekar", sub: "Blouse", harga: 129_000, berat: 220, labelVarian: "Ukuran", varian: uk(["S", "M", "L"], [6, 9, 5]), deskripsi: "Blouse katun dengan lengan balon yang manis, mudah dipadukan dengan rok atau celana.", spesifikasi: { Bahan: "Katun rayon", Lengan: "Balon", Kancing: "Depan" }, tag: ["blouse", "katun"] },
  { nama: "Dress Midi Floral", merek: "Sekar", sub: "Dress", harga: 249_000, hargaCoret: 329_000, berat: 380, labelVarian: "Ukuran", varian: uk(["S", "M", "L"], [3, 5, 2]), unggulan: true, deskripsi: "Dress midi bermotif bunga dengan tali pinggang, jatuh dan ringan dipakai.", spesifikasi: { Bahan: "Rayon premium", Panjang: "Midi", Furing: "Ya" }, tag: ["dress", "floral"] },
  { nama: "Dress Batik Modern", merek: "Wastra", sub: "Dress", harga: 299_000, berat: 400, labelVarian: "Ukuran", varian: uk(["S", "M", "L"], [0, 0, 0]), preorder: true, deskripsi: "Dress batik cap motif parang dengan potongan modern. Dibuat setelah dipesan, estimasi kirim 7 hari.", spesifikasi: { Bahan: "Katun primisima", Teknik: "Batik cap", "Estimasi kirim": "7 hari" }, tag: ["dress", "batik", "pre-order"] },
  { nama: "Rok Plisket Panjang", merek: "Sekar", sub: "Rok", harga: 119_000, berat: 300, labelVarian: "Warna", varian: uk(["Hitam", "Krem", "Hijau Sage"], [10, 7, 4]), deskripsi: "Rok plisket panjang dengan pinggang karet, flowy dan tidak mudah kusut.", spesifikasi: { Bahan: "Hycon", Pinggang: "Karet", Panjang: "90 cm" }, tag: ["rok", "plisket"] },
  // Elektronik
  { nama: "Earbuds Nirkabel TWS Pro", merek: "Suara", sub: "Audio", harga: 399_000, hargaCoret: 549_000, berat: 150, labelVarian: "Warna", varian: uk(["Hitam", "Putih"], [15, 9]), unggulan: true, deskripsi: "Earbuds nirkabel dengan peredam bising aktif dan baterai hingga 30 jam bersama wadahnya.", spesifikasi: { Bluetooth: "5.3", Baterai: "Hingga 30 jam", "Tahan air": "IPX4" }, tag: ["earbuds", "tws", "audio"] },
  { nama: "Speaker Bluetooth Mini", merek: "Suara", sub: "Audio", harga: 259_000, berat: 480, stok: 12, deskripsi: "Speaker portabel berbodi kokoh dengan suara jernih dan bass yang cukup untuk ruangan.", spesifikasi: { Daya: "10 W", Baterai: "12 jam", "Tahan air": "IPX5" }, tag: ["speaker", "bluetooth"] },
  { nama: "Power Bank 20.000 mAh", merek: "Dayakita", sub: "Aksesoris Gadget", harga: 229_000, berat: 420, stok: 25, deskripsi: "Power bank berkapasitas besar dengan pengisian cepat 20 W untuk dua perangkat sekaligus.", spesifikasi: { Kapasitas: "20.000 mAh", Output: "USB-C PD 20 W + USB-A", Berat: "420 g" }, tag: ["power bank", "charger"] },
  { nama: "Kabel USB-C Anyaman 1 m", merek: "Dayakita", sub: "Aksesoris Gadget", harga: 49_000, hargaCoret: 69_000, berat: 60, stok: 60, deskripsi: "Kabel USB-C berlapis anyaman nilon yang tahan tekuk, mendukung pengisian cepat 60 W.", spesifikasi: { Panjang: "1 m", Daya: "Hingga 60 W", Lapisan: "Anyaman nilon" }, tag: ["kabel", "usb-c"] },
  { nama: "Lampu Pintar Wi-Fi", merek: "Terang", sub: "Perangkat Rumah Pintar", harga: 119_000, berat: 200, stok: 0, deskripsi: "Lampu LED 9 W yang bisa diatur warna dan jadwalnya lewat aplikasi atau asisten suara.", spesifikasi: { Daya: "9 W", Fitting: "E27", Koneksi: "Wi-Fi 2,4 GHz" }, tag: ["lampu", "smart home"] },
  { nama: "Kamera CCTV Wi-Fi 1080p", merek: "Terang", sub: "Perangkat Rumah Pintar", harga: 349_000, berat: 500, stok: 0, preorder: true, deskripsi: "Kamera pengawas dalam ruangan dengan rotasi 360° dan penglihatan malam. Stok datang dalam 10 hari.", spesifikasi: { Resolusi: "1080p", Penyimpanan: "microSD hingga 128 GB", "Estimasi kirim": "10 hari" }, tag: ["cctv", "kamera", "pre-order"] },
  // Rumah Tangga
  { nama: "Wajan Anti Lengket 26 cm", merek: "Dapurku", sub: "Peralatan Dapur", harga: 179_000, hargaCoret: 239_000, berat: 1_100, stok: 14, deskripsi: "Wajan berlapis granit anti lengket, cocok untuk kompor gas maupun induksi.", spesifikasi: { Diameter: "26 cm", Lapisan: "Granit", Kompor: "Gas & induksi" }, tag: ["wajan", "dapur"] },
  { nama: "Set Pisau Dapur 5 in 1", merek: "Dapurku", sub: "Peralatan Dapur", harga: 159_000, berat: 900, stok: 9, deskripsi: "Set lima pisau baja tahan karat lengkap dengan dudukan kayu.", spesifikasi: { Isi: "5 pisau + dudukan", Bahan: "Stainless steel", Gagang: "Ergonomis" }, tag: ["pisau", "dapur"] },
  { nama: "Botol Minum Stainless 750 ml", merek: "Dapurku", sub: "Peralatan Dapur", harga: 99_000, berat: 350, labelVarian: "Warna", varian: uk(["Hitam", "Biru", "Merah Muda"], [20, 12, 3]), deskripsi: "Botol dinding ganda yang menjaga minuman dingin 24 jam dan panas 12 jam.", spesifikasi: { Kapasitas: "750 ml", Bahan: "Stainless steel 304", "Bebas BPA": "Ya" }, tag: ["botol", "tumbler"] },
  { nama: "Lilin Aromaterapi Kayu Manis", merek: "Rumahan", sub: "Dekorasi", harga: 69_000, berat: 300, stok: 30, deskripsi: "Lilin soy wax beraroma kayu manis dalam gelas kaca, menyala hingga 40 jam.", spesifikasi: { Bahan: "Soy wax", Aroma: "Kayu manis", "Waktu nyala": "40 jam" }, tag: ["lilin", "aromaterapi"] },
  // Kecantikan
  { nama: "Serum Wajah Niacinamide 30 ml", merek: "Seri Ayu", sub: "Perawatan Wajah", harga: 89_000, hargaCoret: 119_000, berat: 120, stok: 40, unggulan: true, deskripsi: "Serum niacinamide 10% untuk membantu meratakan warna kulit dan menyamarkan pori.", spesifikasi: { Isi: "30 ml", Kandungan: "Niacinamide 10%, Zinc 1%", BPOM: "Terdaftar" }, tag: ["serum", "skincare"] },
  { nama: "Sabun Cuci Muka Gentle 100 ml", merek: "Seri Ayu", sub: "Perawatan Wajah", harga: 49_000, berat: 150, stok: 50, deskripsi: "Pembersih wajah berbusa lembut dengan pH seimbang, cocok untuk kulit sensitif.", spesifikasi: { Isi: "100 ml", "Jenis kulit": "Semua jenis", BPOM: "Terdaftar" }, tag: ["sabun wajah", "skincare"] },
  { nama: "Sampo Anti Ketombe", merek: "Rambutku", sub: "Perawatan Rambut", harga: 59_000, berat: 300, labelVarian: "Ukuran", varian: [{ nama: "250 ml", stok: 18 }, { nama: "500 ml", stok: 10, harga: 99_000, berat: 580 }], deskripsi: "Sampo dengan zinc pyrithione untuk membantu mengurangi ketombe dan gatal.", spesifikasi: { Kandungan: "Zinc pyrithione, menthol", "Jenis rambut": "Semua jenis", BPOM: "Terdaftar" }, tag: ["sampo", "haircare"] },
  // Olahraga
  { nama: "Sepatu Lari Ringan", merek: "Langkah", sub: "Sepatu Olahraga", harga: 459_000, hargaCoret: 599_000, berat: 800, labelVarian: "Ukuran", varian: uk(["39", "40", "41", "42", "43"], [2, 4, 6, 3, 0]), unggulan: true, deskripsi: "Sepatu lari dengan bantalan ringan dan upper mesh yang bernapas untuk latihan harian.", spesifikasi: { Upper: "Mesh", Sol: "EVA + karet", Berat: "260 g per pasang ukuran 42" }, tag: ["sepatu", "lari"] },
  { nama: "Matras Yoga 6 mm", merek: "Bugar", sub: "Perlengkapan Gym", harga: 149_000, berat: 1_200, labelVarian: "Warna", varian: uk(["Ungu", "Hijau"], [8, 6]), deskripsi: "Matras TPE anti selip dua sisi, lengkap dengan tali pembawa.", spesifikasi: { Tebal: "6 mm", Bahan: "TPE", Ukuran: "183 × 61 cm" }, tag: ["yoga", "matras"] },
  { nama: "Dumbel Hex 5 kg (Sepasang)", merek: "Bugar", sub: "Perlengkapan Gym", harga: 289_000, berat: 10_500, stok: 5, deskripsi: "Sepasang dumbel heksagonal berlapis karet yang tidak menggelinding.", spesifikasi: { Berat: "2 × 5 kg", Lapisan: "Karet", Gagang: "Krom bertekstur" }, tag: ["dumbel", "gym"] },
  { nama: "Resistance Band Set", merek: "Bugar", sub: "Perlengkapan Gym", harga: 79_000, berat: 250, stok: 22, deskripsi: "Lima karet latihan dengan tingkat tahanan berbeda untuk latihan di rumah.", spesifikasi: { Isi: "5 band", Tahanan: "5-40 kg", Bahan: "Lateks alami" }, tag: ["resistance band", "gym"] },
];

// ---------------------------------------------------------------------------
// Pengguna

const PEMBELI_CONTOH: { nama: string; kota: string; kecamatan: string; provinsi: string; kodePos: string }[] = [
  { nama: "Rina Wulandari", kota: "Jakarta", kecamatan: "Tebet", provinsi: "DKI Jakarta", kodePos: "12810" },
  { nama: "Budi Santoso", kota: "Bandung", kecamatan: "Coblong", provinsi: "Jawa Barat", kodePos: "40132" },
  { nama: "Siti Rahmawati", kota: "Surabaya", kecamatan: "Gubeng", provinsi: "Jawa Timur", kodePos: "60281" },
  { nama: "Agus Pratama", kota: "Jakarta", kecamatan: "Kebayoran Baru", provinsi: "DKI Jakarta", kodePos: "12130" },
  { nama: "Dewi Lestari", kota: "Yogyakarta", kecamatan: "Gondokusuman", provinsi: "DI Yogyakarta", kodePos: "55223" },
  { nama: "Andi Saputra", kota: "Makassar", kecamatan: "Panakkukang", provinsi: "Sulawesi Selatan", kodePos: "90231" },
  { nama: "Maya Putri", kota: "Semarang", kecamatan: "Banyumanik", provinsi: "Jawa Tengah", kodePos: "50263" },
  { nama: "Rizky Hidayat", kota: "Medan", kecamatan: "Medan Baru", provinsi: "Sumatera Utara", kodePos: "20153" },
  { nama: "Fitri Handayani", kota: "Jakarta", kecamatan: "Cempaka Putih", provinsi: "DKI Jakarta", kodePos: "10510" },
  { nama: "Yoga Permana", kota: "Denpasar", kecamatan: "Denpasar Selatan", provinsi: "Bali", kodePos: "80222" },
  { nama: "Nadia Kusuma", kota: "Malang", kecamatan: "Lowokwaru", provinsi: "Jawa Timur", kodePos: "65141" },
  { nama: "Hendra Wijaya", kota: "Palembang", kecamatan: "Ilir Timur I", provinsi: "Sumatera Selatan", kodePos: "30114" },
];

const ULASAN = {
  5: ["Barangnya bagus banget, sesuai foto dan pengiriman cepat.", "Kualitas melebihi harga, pasti beli lagi di sini.", "Mantap, packing rapi dan aman sampai tujuan.", "Sangat puas, bahannya enak dan ukurannya pas."],
  4: ["Barang bagus, hanya pengirimannya sedikit lama.", "Sesuai deskripsi, warnanya sedikit berbeda dari foto.", "Kualitas oke untuk harga segini, recommended."],
  3: ["Cukup sesuai harga, tapi ada sedikit cacat jahitan.", "Lumayan, tapi ekspektasi saya sedikit lebih tinggi."],
  2: ["Ukurannya kurang pas dengan tabel ukuran, agak kecewa."],
} as const;
function pilihRating(): 2 | 3 | 4 | 5 {
  const x = rng.acak();
  return x < 0.55 ? 5 : x < 0.85 ? 4 : x < 0.96 ? 3 : 2;
}

// ---------------------------------------------------------------------------
// Pesanan

type AlamatSnapshot = {
  label: string;
  name: string;
  phone: string;
  street: string;
  city: string;
  district: string;
  province: string;
  postalCode: string;
};
type ItemRencana = { productId: number; variantId: number | null; qty: number };
type LangkahStatus = { status: "pending" | "confirmed" | "packed" | "shipped" | "delivered" | "cancelled"; pada: Date; oleh: "pembeli" | "admin" | "sistem"; catatan: string };
type RencanaPesanan = {
  userId: number;
  alamat: AlamatSnapshot;
  items: ItemRencana[];
  metode: Metode;
  kurir: Kurir;
  promo: string | null;
  dibuat: Date;
  akhir: "pending" | "pending-lewat" | "confirmed" | "packed" | "shipped" | "delivered" | "batal-pembeli" | "batal-admin-refund";
  catatan?: string;
  ulasan?: Map<number, 2 | 3 | 4 | 5>; // index item -> rating
};

const PAYMENT_TYPE: Record<Exclude<Metode, "cod">, string> = { qris: "qris", bank_bca: "bank_transfer", bank_mandiri: "echannel" };

function resi(kurir: Kurir) {
  const angka = String(rng.antara(100_000_000, 999_999_999));
  return kurir === "jne_reg" ? `JNE${angka}${rng.antara(10, 99)}` : kurir === "sicepat_reg" ? `SCP${angka}` : `GK-${angka}`;
}

async function main() {
  console.log("Menghapus data lama…");
  await prisma.review.deleteMany();
  await prisma.promoUsage.deleteMany();
  await prisma.orderStatusLog.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany({ where: { parentId: { not: null } } });
  await prisma.category.deleteMany();
  await prisma.address.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.user.deleteMany();
  await prisma.promoCode.deleteMany();
  await prisma.banner.deleteMany();

  // --- Pengguna -------------------------------------------------------------
  console.log("Membuat pengguna…");
  // Parameter sama dengan src/lib/auth/password.ts (Argon2id, D17).
  const opsiArgon = { algorithm: 2 as Algorithm /* Argon2id */, memoryCost: 19_456, timeCost: 2, parallelism: 1 };
  const hashAdmin = await hash("admin12345", opsiArgon);
  const hashPembeli = await hash("password123", opsiArgon);

  const admin = await prisma.user.create({
    data: { name: "Admin TokoKita", email: "admin@tokokita.id", phone: "081100000001", passwordHash: hashAdmin, role: "admin", createdAt: lalu(120) },
  });

  const demo = await prisma.user.create({
    data: {
      name: "Demo Pembeli",
      email: "demo@tokokita.id",
      phone: "081234567890",
      passwordHash: hashPembeli,
      createdAt: lalu(100),
      addresses: {
        create: [
          { label: "Rumah", name: "Demo Pembeli", phone: "081234567890", street: "Jl. Kenanga No. 12, RT 03/RW 05", city: "Jakarta", district: "Tebet", province: "DKI Jakarta", postalCode: "12820", isDefault: true },
          { label: "Kantor", name: "Demo Pembeli", phone: "081234567890", street: "Jl. Asia Afrika No. 88, Lantai 5", city: "Bandung", district: "Sumur Bandung", province: "Jawa Barat", postalCode: "40111", isDefault: false },
        ],
      },
    },
    include: { addresses: { orderBy: { id: "asc" } } },
  });
  const snapshot = (a: { label: string; name: string; phone: string; street: string; city: string; district: string; province: string; postalCode: string }): AlamatSnapshot => ({
    label: a.label, name: a.name, phone: a.phone, street: a.street, city: a.city, district: a.district, province: a.province, postalCode: a.postalCode,
  });
  const alamatRumah = snapshot(demo.addresses[0]!);
  const alamatKantor = snapshot(demo.addresses[1]!);

  const pembeli: { id: number; alamat: AlamatSnapshot }[] = [];
  for (const [i, p] of PEMBELI_CONTOH.entries()) {
    const telepon = `08${String(1300000000 + i * 7919).padStart(10, "0")}`;
    const u = await prisma.user.create({
      data: {
        name: p.nama,
        email: `pembeli${i + 1}@example.com`,
        phone: telepon,
        passwordHash: hashPembeli,
        createdAt: lalu(95 - i),
        addresses: {
          create: { label: "Rumah", name: p.nama, phone: telepon, street: `Jl. Melati No. ${10 + i}`, city: p.kota, district: p.kecamatan, province: p.provinsi, postalCode: p.kodePos, isDefault: true },
        },
      },
      include: { addresses: true },
    });
    pembeli.push({ id: u.id, alamat: snapshot(u.addresses[0]!) });
  }

  // --- Kategori --------------------------------------------------------------
  console.log("Membuat kategori…");
  const idSub = new Map<string, number>();
  for (const [i, k] of KATEGORI.entries()) {
    const induk = await prisma.category.create({ data: { name: k.nama, slug: slugify(k.nama), image: gambar(`kategori-${slugify(k.nama)}`, 1), sortOrder: i } });
    for (const [j, s] of k.sub.entries()) {
      const sub = await prisma.category.create({ data: { name: s, slug: slugify(s), parentId: induk.id, sortOrder: j } });
      idSub.set(s, sub.id);
    }
  }

  // --- Produk ----------------------------------------------------------------
  console.log("Membuat produk…");
  type ProdukDb = { id: number; seed: ProdukSeed; varian: { id: number; nama: string; harga: number; berat: number }[] };
  const produkDb: ProdukDb[] = [];
  for (const [i, p] of PRODUK.entries()) {
    const slug = slugify(p.nama);
    const stokTotal = p.varian ? p.varian.reduce((s, v) => s + v.stok, 0) : (p.stok ?? 0);
    const dibuat = await prisma.product.create({
      data: {
        name: p.nama,
        slug,
        description: p.deskripsi,
        specs: p.spesifikasi,
        price: p.harga,
        compareAtPrice: p.hargaCoret ?? null,
        brand: p.merek,
        categoryId: idSub.get(p.sub)!,
        tags: p.tag,
        weight: p.berat,
        stock: stokTotal,
        isPreorder: p.preorder ?? false,
        isFeatured: p.unggulan ?? false,
        variantLabel: p.labelVarian ?? null,
        createdAt: lalu(110 - i),
        images: { create: [0, 1, 2].map((n) => ({ url: gambar(slug, n + 1), sortOrder: n })) },
        variants: p.varian
          ? { create: p.varian.map((v, n) => ({ name: v.nama, stock: v.stok, price: v.harga ?? null, weight: v.berat ?? null, sortOrder: n })) }
          : undefined,
      },
      include: { variants: { orderBy: { sortOrder: "asc" } } },
    });
    produkDb.push({
      id: dibuat.id,
      seed: p,
      varian: dibuat.variants.map((v) => ({ id: v.id, nama: v.name, harga: v.price ?? p.harga, berat: v.weight ?? p.berat })),
    });
  }
  const produkMenurutNama = new Map(produkDb.map((p) => [p.seed.nama, p]));
  const item = (nama: string, qty = 1, varian?: string): ItemRencana => {
    const p = produkMenurutNama.get(nama);
    if (!p) throw new Error(`Seed: produk ${nama} tidak ada`);
    if (p.varian.length === 0) return { productId: p.id, variantId: null, qty };
    const v = varian ? p.varian.find((x) => x.nama === varian) : p.varian[0];
    if (!v) throw new Error(`Seed: varian ${varian} untuk ${nama} tidak ada`);
    return { productId: p.id, variantId: v.id, qty };
  };

  // --- Promo & banner --------------------------------------------------------
  console.log("Membuat promo dan banner…");
  for (const p of PROMO) {
    await prisma.promoCode.create({
      data: { ...p, quota: p.code === "BELANJA50" ? 100 : null, startsAt: lalu(30), expiresAt: tambah(SEKARANG, 90 * 24), isActive: true },
    });
  }
  await prisma.banner.createMany({
    data: [
      { title: "Diskon Akhir Bulan hingga 30%", subtitle: "Fashion, elektronik, dan kebutuhan rumah pilihan", cta: "Belanja Sekarang", href: "/produk?urut=terpopuler", image: gambar("banner-diskon", 1), sortOrder: 0 },
      { title: "Potongan Rp 20.000", subtitle: "Pakai kode ONGKIRFREE untuk belanja min. Rp 150.000", cta: "Lihat Produk", href: "/produk", image: gambar("banner-ongkir", 1), sortOrder: 1 },
      { title: "Koleksi Olahraga Terbaru", subtitle: "Sepatu lari, matras yoga, dan perlengkapan gym", cta: "Mulai Bergerak", href: "/produk?kategori=olahraga", image: gambar("banner-olahraga", 1), sortOrder: 2 },
    ],
  });

  // --- Rencana pesanan: akun demo (semua status, PRD §20) -----------------------
  const rencana: RencanaPesanan[] = [
    { userId: demo.id, alamat: alamatRumah, items: [item("Kaos Polos Premium", 2, "M"), item("Celana Chino Slim", 1, "31")], metode: "bank_bca", kurir: "jne_reg", promo: "ONGKIRFREE", dibuat: lalu(60), akhir: "delivered", ulasan: new Map([[0, 5]]) },
    { userId: demo.id, alamat: alamatRumah, items: [item("Serum Wajah Niacinamide 30 ml"), item("Sabun Cuci Muka Gentle 100 ml")], metode: "qris", kurir: "gosend_instant", promo: null, dibuat: lalu(45), akhir: "delivered" },
    { userId: demo.id, alamat: alamatKantor, items: [item("Botol Minum Stainless 750 ml", 1, "Biru")], metode: "cod", kurir: "sicepat_reg", promo: null, dibuat: lalu(38), akhir: "delivered" },
    { userId: demo.id, alamat: alamatRumah, items: [item("Earbuds Nirkabel TWS Pro", 1, "Hitam")], metode: "bank_mandiri", kurir: "jne_reg", promo: null, dibuat: lalu(12), akhir: "shipped", catatan: "Tolong dibungkus bubble wrap tebal." },
    { userId: demo.id, alamat: alamatKantor, items: [item("Matras Yoga 6 mm", 1, "Ungu"), item("Resistance Band Set")], metode: "qris", kurir: "sicepat_reg", promo: null, dibuat: lalu(4), akhir: "shipped" },
    { userId: demo.id, alamat: alamatRumah, items: [item("Wajan Anti Lengket 26 cm")], metode: "bank_bca", kurir: "jne_reg", promo: null, dibuat: lalu(3), akhir: "packed" },
    { userId: demo.id, alamat: alamatRumah, items: [item("Speaker Bluetooth Mini")], metode: "qris", kurir: "gosend_instant", promo: null, dibuat: lalu(2), akhir: "confirmed" },
    { userId: demo.id, alamat: alamatKantor, items: [item("Rok Plisket Panjang", 1, "Krem")], metode: "cod", kurir: "jne_reg", promo: null, dibuat: lalu(1, 5), akhir: "confirmed" },
    { userId: demo.id, alamat: alamatRumah, items: [item("Dress Midi Floral", 1, "M")], metode: "bank_mandiri", kurir: "jne_reg", promo: "ONGKIRFREE", dibuat: lalu(0, 3), akhir: "pending" },
    { userId: demo.id, alamat: alamatRumah, items: [item("Power Bank 20.000 mAh"), item("Kabel USB-C Anyaman 1 m", 2)], metode: "bank_bca", kurir: "sicepat_reg", promo: null, dibuat: lalu(1, 6), akhir: "pending-lewat" },
    { userId: demo.id, alamat: alamatRumah, items: [item("Kemeja Flanel Kotak", 1, "L")], metode: "qris", kurir: "jne_reg", promo: null, dibuat: lalu(20), akhir: "batal-pembeli" },
    { userId: demo.id, alamat: alamatKantor, items: [item("Sepatu Lari Ringan", 1, "42")], metode: "bank_bca", kurir: "jne_reg", promo: null, dibuat: lalu(25), akhir: "batal-admin-refund" },
  ];

  // --- Rencana pesanan: pembeli contoh (sumber ulasan terverifikasi) -----------
  const produkPerPembeli = new Map<number, number[]>(); // index pembeli -> index produk
  for (const [ip] of produkDb.entries()) {
    const jumlahUlasan = rng.antara(3, 12);
    for (const ib of rng.kocok(pembeli.map((_, i) => i)).slice(0, jumlahUlasan)) {
      produkPerPembeli.set(ib, [...(produkPerPembeli.get(ib) ?? []), ip]);
    }
  }
  for (const [ib, daftar] of produkPerPembeli) {
    const b = pembeli[ib]!;
    const acakDaftar = rng.kocok(daftar);
    for (let k = 0; k < acakDaftar.length; k += 3) {
      const bagian = acakDaftar.slice(k, k + 3);
      const items = bagian.map((ip) => {
        const p = produkDb[ip]!;
        return { productId: p.id, variantId: p.varian.length ? rng.pilih(p.varian).id : null, qty: rng.antara(1, 2) };
      });
      const berat = items.reduce((s, it) => s + beratItem(it) * it.qty, 0);
      const kurirBoleh: Kurir[] = gosendBoleh(b.alamat.city, berat) ? ["jne_reg", "sicepat_reg", "gosend_instant"] : ["jne_reg", "sicepat_reg"];
      rencana.push({
        userId: b.id,
        alamat: b.alamat,
        items,
        metode: rng.pilih(["qris", "bank_bca", "bank_mandiri", "cod"] as const),
        kurir: rng.pilih(kurirBoleh),
        promo: null,
        dibuat: lalu(rng.antara(20, 90), rng.antara(0, 12)),
        akhir: "delivered",
        ulasan: new Map(items.map((_, i) => [i, pilihRating()])),
      });
    }
  }

  function hargaItem(it: ItemRencana) {
    const p = produkDb.find((x) => x.id === it.productId)!;
    return it.variantId ? p.varian.find((v) => v.id === it.variantId)!.harga : p.seed.harga;
  }
  function beratItem(it: ItemRencana) {
    const p = produkDb.find((x) => x.id === it.productId)!;
    return it.variantId ? p.varian.find((v) => v.id === it.variantId)!.berat : p.seed.berat;
  }

  // Nomor pesanan berurutan per bulan menurut waktu dibuat (PRD §10.5 langkah 7)
  rencana.sort((a, b) => a.dibuat.getTime() - b.dibuat.getTime());
  const urutPerBulan = new Map<string, number>();
  const nomorPesanan = (waktu: Date) => {
    const wib = new Date(waktu.getTime() + 7 * JAM);
    const bulan = `${wib.getUTCFullYear()}${String(wib.getUTCMonth() + 1).padStart(2, "0")}`;
    const n = (urutPerBulan.get(bulan) ?? 0) + 1;
    urutPerBulan.set(bulan, n);
    return `INV-${bulan}-${String(n).padStart(4, "0")}`;
  };

  console.log(`Membuat ${rencana.length} pesanan…`);
  let jumlahUlasan = 0;
  for (const r of rencana) {
    const subtotal = r.items.reduce((s, it) => s + hargaItem(it) * it.qty, 0);
    const totalBerat = r.items.reduce((s, it) => s + beratItem(it) * it.qty, 0);
    if (r.kurir === "gosend_instant" && !gosendBoleh(r.alamat.city, totalBerat)) throw new Error("Seed: GoSend dipakai di luar syarat");
    const ongkir = hitungOngkir(r.kurir, totalBerat);
    const diskon = hitungDiskon(r.promo, subtotal);
    const nomor = nomorPesanan(r.dibuat);
    const cod = r.metode === "cod";

    // Jejak status sesuai PRD §10.6
    const log: LangkahStatus[] = [];
    let t = r.dibuat;
    const maju = (jam: number) => (t = tambah(t, jam));
    log.push(cod ? { status: "confirmed", pada: t, oleh: "pembeli", catatan: "Pesanan dibuat (bayar di tempat)" } : { status: "pending", pada: t, oleh: "pembeli", catatan: "Pesanan dibuat" });

    let paidAt: Date | null = null;
    let shippedAt: Date | null = null;
    let deliveredAt: Date | null = null;
    let cancelledAt: Date | null = null;
    let cancelReason: string | null = null;
    let trackingNumber: string | null = null;
    let paymentStatus: "unpaid" | "paid" | "refunded" = "unpaid";

    const lunasTransfer = () => {
      paidAt = maju(rng.antara(1, 6));
      paymentStatus = "paid";
      log.push({ status: "confirmed", pada: paidAt, oleh: "sistem", catatan: "Pembayaran diterima" });
    };
    const akhirJalur = ["confirmed", "packed", "shipped", "delivered", "batal-admin-refund"];
    if (!cod && akhirJalur.includes(r.akhir)) lunasTransfer();
    if (["packed", "shipped", "delivered"].includes(r.akhir)) log.push({ status: "packed", pada: maju(rng.antara(4, 20)), oleh: "admin", catatan: "Pesanan dikemas" });
    if (["shipped", "delivered"].includes(r.akhir)) {
      trackingNumber = resi(r.kurir);
      shippedAt = maju(r.kurir === "gosend_instant" ? 1 : rng.antara(4, 24));
      log.push({ status: "shipped", pada: shippedAt, oleh: "admin", catatan: `Dikirim, resi ${trackingNumber}` });
    }
    if (r.akhir === "delivered") {
      deliveredAt = maju(r.kurir === "gosend_instant" ? 2 : rng.antara(24, 72));
      if (cod) {
        paymentStatus = "paid";
        paidAt = deliveredAt;
      }
      log.push({ status: "delivered", pada: deliveredAt, oleh: "pembeli", catatan: cod ? "Pesanan diterima, dibayar di tempat" : "Pesanan diterima" });
    }
    if (r.akhir === "batal-pembeli") {
      cancelledAt = maju(rng.antara(2, 10));
      cancelReason = "Dibatalkan pembeli sebelum membayar";
      log.push({ status: "cancelled", pada: cancelledAt, oleh: "pembeli", catatan: cancelReason });
    }
    if (r.akhir === "batal-admin-refund") {
      cancelledAt = maju(rng.antara(10, 30));
      cancelReason = "Stok ukuran yang dipesan rusak saat pengecekan gudang";
      paymentStatus = "refunded";
      log.push({ status: "cancelled", pada: cancelledAt, oleh: "admin", catatan: `${cancelReason}; dana dikembalikan` });
    }

    const status =
      r.akhir === "pending" || r.akhir === "pending-lewat" ? "pending"
      : r.akhir === "batal-pembeli" || r.akhir === "batal-admin-refund" ? "cancelled"
      : r.akhir;
    // Batas bayar 24 jam untuk non-COD (PRD §10.5 langkah 8). "pending-lewat"
    // sengaja sudah lewat batas agar demo batal otomatis bisa ditunjukkan.
    const paymentDueAt = cod ? null : tambah(r.dibuat, 24);
    const lewatGateway = !cod && paymentStatus !== "unpaid";

    const pesanan = await prisma.order.create({
      data: {
        orderNumber: nomor,
        userId: r.userId,
        subtotal,
        shippingCost: ongkir,
        discount: diskon,
        tax: 0,
        grandTotal: subtotal + ongkir - diskon,
        totalWeight: totalBerat,
        status,
        paymentMethod: r.metode,
        paymentStatus,
        paymentDueAt,
        paidAt,
        shippingAddress: r.alamat,
        shippingMethod: r.kurir,
        trackingNumber,
        promoCode: r.promo,
        notes: r.catatan ?? null,
        cancelReason,
        shippedAt,
        deliveredAt,
        cancelledAt,
        createdAt: r.dibuat,
        paymentAttempt: lewatGateway ? 1 : 0,
        paymentTransactionId: lewatGateway ? nomor : null,
        paymentType: lewatGateway ? PAYMENT_TYPE[r.metode as Exclude<Metode, "cod">] : null,
        items: {
          create: r.items.map((it) => {
            const p = produkDb.find((x) => x.id === it.productId)!;
            const v = it.variantId ? p.varian.find((x) => x.id === it.variantId)! : null;
            return {
              productId: it.productId,
              variantId: it.variantId,
              name: p.seed.nama,
              variantName: v?.nama ?? null,
              image: gambar(slugify(p.seed.nama), 1),
              price: hargaItem(it),
              weight: beratItem(it),
              quantity: it.qty,
            };
          }),
        },
        statusLogs: {
          create: log.map((l) => ({
            status: l.status,
            note: l.catatan,
            changedById: l.oleh === "pembeli" ? r.userId : l.oleh === "admin" ? admin.id : null,
            createdAt: l.pada,
          })),
        },
      },
      include: { items: { orderBy: { id: "asc" } } },
    });

    // Promo tercatat hanya untuk pesanan yang tidak batal (kuota kembali saat batal)
    if (r.promo && status !== "cancelled") {
      await prisma.promoUsage.create({ data: { code: r.promo, userId: r.userId, orderId: pesanan.id, createdAt: r.dibuat } });
    }

    // Ulasan terverifikasi: hanya item pesanan delivered, maks. 30 hari setelahnya
    if (status === "delivered" && r.ulasan && deliveredAt) {
      for (const [idx, rating] of r.ulasan) {
        const oi = pesanan.items[idx]!;
        await prisma.review.create({
          data: {
            productId: oi.productId,
            userId: r.userId,
            orderItemId: oi.id,
            rating,
            content: rng.pilih(ULASAN[rating]),
            images: [],
            createdAt: tambah(deliveredAt, rng.antara(2, 24 * 10)),
          },
        });
        jumlahUlasan++;
      }
    }
  }

  // --- Angka turunan -----------------------------------------------------------
  console.log("Menghitung rating, jumlah terjual, dan kuota promo…");
  for (const p of produkDb) {
    const agg = await prisma.review.aggregate({ where: { productId: p.id }, _avg: { rating: true }, _count: true });
    const terjual = await prisma.orderItem.aggregate({ where: { productId: p.id, order: { status: { not: "cancelled" } } }, _sum: { quantity: true } });
    await prisma.product.update({
      where: { id: p.id },
      data: {
        rating: Math.round((agg._avg.rating ?? 0) * 10) / 10,
        reviewCount: agg._count,
        soldCount: terjual._sum.quantity ?? 0,
      },
    });
  }
  for (const p of PROMO) {
    await prisma.promoCode.update({ where: { code: p.code }, data: { usedCount: await prisma.promoUsage.count({ where: { code: p.code } }) } });
  }

  // --- Wishlist demo -------------------------------------------------------------
  await prisma.wishlistItem.createMany({
    data: ["Dress Batik Modern", "Sepatu Lari Ringan", "Kamera CCTV Wi-Fi 1080p", "Lilin Aromaterapi Kayu Manis"].map((nama, i) => ({
      userId: demo.id,
      productId: produkMenurutNama.get(nama)!.id,
      createdAt: lalu(10 - i),
    })),
  });

  console.log(
    `Selesai: ${2 + pembeli.length} pengguna, ${KATEGORI.length} kategori + ${idSub.size} sub, ${produkDb.length} produk, ` +
      `${rencana.length} pesanan (${rencana.filter((r) => r.userId === demo.id).length} milik akun demo), ${jumlahUlasan} ulasan, ${PROMO.length} promo, 3 banner.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
