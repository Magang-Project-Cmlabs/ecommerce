// Membuat ilustrasi produk, banner, dan kategori untuk data demo (public/demo).
// Pengganti foto acak Picsum yang tidak cocok dengan nama produk. Nama berkas
// tetap `tokokita-<slug>-<n>.webp`, sehingga tidak ada URL di database yang berubah.
// Jalankan: npx tsx scripts/buat-ilustrasi-demo.ts   (banner + kategori; hanya membaca DB, menulis public/demo)
// Tambahkan --produk untuk juga menimpa gambar produk dengan ilustrasi (JANGAN jika sudah memakai foto asli).
import 'dotenv/config';
import path from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';
import { createElement, type ComponentType } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import * as Lucide from 'lucide-react';
import sharp from 'sharp';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../src/generated/prisma/client';
import { konfigurasiDb } from '../src/lib/konfigurasi-db';

type Ikon = ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
const ikon = (nama: string): Ikon => ((Lucide as unknown as Record<string, Ikon>)[nama] ?? Lucide.Package);

/** Isi <svg> lucide tanpa tag pembungkus, supaya bisa diposisikan lewat <g transform>. */
function isiIkon(nama: string, warna: string, tebal = 1.5): string {
  const svg = renderToStaticMarkup(createElement(ikon(nama), { size: 24, color: warna, strokeWidth: tebal }));
  return svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
}
const taruh = (nama: string, x: number, y: number, ukuran: number, warna: string, tebal = 1.5, opacity = 1) =>
  `<g transform="translate(${x} ${y}) scale(${ukuran / 24})" opacity="${opacity}"><g fill="none" stroke="${warna}" stroke-width="${tebal}" stroke-linecap="round" stroke-linejoin="round">${isiIkon(nama, warna, tebal)}</g></g>`;

const hindari = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
function bungkus(teks: string, maks: number): string[] {
  const baris: string[] = [];
  let saatIni = '';
  for (const kata of teks.split(' ')) {
    if ((saatIni + ' ' + kata).trim().length > maks && saatIni) { baris.push(saatIni); saatIni = kata; }
    else saatIni = (saatIni + ' ' + kata).trim();
  }
  if (saatIni) baris.push(saatIni);
  return baris.slice(0, 3);
}

// Palet per kelompok kategori: latar muda, warna aksen, warna aksen gelap.
const PALET = {
  fashion: { latar: '#FFF7ED', aksen: '#EA580C', gelap: '#9A3412' },
  elektronik: { latar: '#F1F5F9', aksen: '#334155', gelap: '#0F172A' },
  rumah: { latar: '#FFFBEB', aksen: '#D97706', gelap: '#92400E' },
  kecantikan: { latar: '#FFF1F2', aksen: '#E11D48', gelap: '#9F1239' },
  olahraga: { latar: '#F0FDFA', aksen: '#0F766E', gelap: '#115E59' },
} as const;
type Kelompok = keyof typeof PALET;

const KELOMPOK: Record<string, Kelompok> = {
  'kaos-pria': 'fashion', 'kemeja-pria': 'fashion', 'celana-pria': 'fashion', blouse: 'fashion', dress: 'fashion', rok: 'fashion',
  audio: 'elektronik', 'aksesoris-gadget': 'elektronik', 'perangkat-rumah-pintar': 'elektronik',
  'peralatan-dapur': 'rumah', dekorasi: 'rumah',
  'perawatan-wajah': 'kecantikan', 'perawatan-rambut': 'kecantikan',
  'sepatu-olahraga': 'olahraga', 'perlengkapan-gym': 'olahraga',
};
const IKON_PRODUK: Record<string, string> = {
  'kaos-polos-premium': 'Shirt', 'kaos-grafis-nusantara': 'Shirt', 'kemeja-flanel-kotak': 'Shirt', 'kemeja-linen-santai': 'Shirt',
  'celana-chino-slim': 'Ruler', 'blouse-katun-lengan-balon': 'Shirt', 'dress-midi-floral': 'Flower2', 'dress-batik-modern': 'Gem',
  'rok-plisket-panjang': 'Scissors', 'earbuds-nirkabel-tws-pro': 'Headphones', 'speaker-bluetooth-mini': 'Speaker',
  'power-bank-20-000-mah': 'BatteryCharging', 'kabel-usb-c-anyaman-1-m': 'Cable', 'lampu-pintar-wi-fi': 'Lightbulb',
  'kamera-cctv-wi-fi-1080p': 'Cctv', 'wajan-anti-lengket-26-cm': 'CookingPot', 'set-pisau-dapur-5-in-1': 'ChefHat',
  'botol-minum-stainless-750-ml': 'CupSoda', 'lilin-aromaterapi-kayu-manis': 'Flame', 'serum-wajah-niacinamide-30-ml': 'FlaskConical',
  'sabun-cuci-muka-gentle-100-ml': 'Droplets', 'sampo-anti-ketombe': 'Bath', 'sepatu-lari-ringan': 'Footprints',
  'matras-yoga-6-mm': 'Waves', 'dumbel-hex-5-kg-sepasang': 'Dumbbell', 'resistance-band-set': 'Activity',
};
const IKON_KATEGORI: Record<string, string> = {
  'fashion-pria': 'Shirt', 'fashion-wanita': 'UserRound', elektronik: 'Smartphone', 'rumah-tangga': 'Sofa', kecantikan: 'SprayCan', olahraga: 'Dumbbell',
};

function ilustrasiProduk(n: number, p: { nama: string; merek: string | null; kategori: string; ikon: string; kelompok: Kelompok }): string {
  const { latar, aksen, gelap } = PALET[p.kelompok];
  const judul = bungkus(p.nama, 20);
  const pendek = p.nama.length > 28 ? p.nama.slice(0, 27) + "…" : p.nama;
  const sub = hindari([p.merek, p.kategori].filter(Boolean).join(' · '));
  const defs = `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${aksen}"/><stop offset="1" stop-color="${gelap}"/></linearGradient></defs>`;
  const rangka = (isi: string) => `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">${defs}${isi}</svg>`;
  const teks = (y0: number, warna: string, warnaSub: string, rata = 'middle', x = 400) =>
    judul.map((b, i) => `<text x="${x}" y="${y0 + i * 58}" text-anchor="${rata}" font-family="Inter, Arial, sans-serif" font-size="48" font-weight="700" fill="${warna}">${hindari(b)}</text>`).join('') +
    `<text x="${x}" y="${y0 + judul.length * 58 + 8}" text-anchor="${rata}" font-family="Inter, Arial, sans-serif" font-size="30" fill="${warnaSub}">${sub}</text>`;

  if (n === 1) {
    return rangka(`<rect width="800" height="800" fill="${latar}"/><circle cx="400" cy="300" r="330" fill="${aksen}" opacity="0.07"/>
      <circle cx="400" cy="290" r="190" fill="url(#g)"/>${taruh(p.ikon, 400 - 120, 290 - 120, 240, '#ffffff', 1.4)}
      ${teks(578, '#0F172A', '#475569')}`);
  }
  if (n === 2) {
    return rangka(`<rect width="800" height="800" fill="url(#g)"/>${taruh(p.ikon, 190, 120, 680, '#ffffff', 0.9, 0.16)}
      <rect x="60" y="560" width="680" height="180" rx="28" fill="#ffffff" opacity="0.96"/>
      <text x="100" y="640" font-family="Inter, Arial, sans-serif" font-size="34" font-weight="700" fill="#0F172A">${hindari(pendek)}</text>
      <text x="100" y="696" font-family="Inter, Arial, sans-serif" font-size="30" fill="#475569">${sub}</text>
      ${taruh(p.ikon, 640, 600, 64, aksen, 1.6)}`);
  }
  const pola = Array.from({ length: 16 }, (_, i) => taruh(p.ikon, 50 + (i % 4) * 190, 40 + Math.floor(i / 4) * 190, 90, aksen, 1.3, 0.14)).join('');
  return rangka(`<rect width="800" height="800" fill="${latar}"/>${pola}
    <rect x="120" y="270" width="560" height="260" rx="36" fill="#ffffff" stroke="${aksen}" stroke-opacity="0.25" stroke-width="3"/>
    <circle cx="400" cy="270" r="62" fill="url(#g)"/>${taruh(p.ikon, 400 - 34, 270 - 34, 68, '#ffffff', 1.6)}
    ${teks(380, '#0F172A', '#475569')}`);
}

// Banner: gradien oranye + kolase foto produk nyata (public/demo) pada kartu miring melayang.
const FOTO_BANNER: Record<string, string[]> = {
  diskon: ['kaos-polos-premium', 'earbuds-nirkabel-tws-pro', 'sepatu-lari-ringan'],
  ongkir: ['power-bank-20-000-mah', 'speaker-bluetooth-mini', 'wajan-anti-lengket-26-cm'],
  olahraga: ['sepatu-lari-ringan', 'dumbel-hex-5-kg-sepasang', 'matras-yoga-6-mm'],
};
const WARNA_BANNER: Record<string, [string, string]> = { diskon: ['#EA580C', '#7C2D12'], ongkir: ['#C2410C', '#431407'], olahraga: ['#F97316', '#7C2D12'] };

async function ilustrasiBanner(nama: string): Promise<string> {
  const [dari, ke] = WARNA_BANNER[nama] ?? WARNA_BANNER.diskon!;
  const slugs = FOTO_BANNER[nama] ?? FOTO_BANNER.diskon!;
  const kartu = [
    { x: 880, y: 150, putar: -7, ukuran: 300 },
    { x: 1140, y: 70, putar: 5, ukuran: 340 },
    { x: 1330, y: 250, putar: -4, ukuran: 250 },
  ];
  let isi = '';
  for (const [i, k] of kartu.entries()) {
    const jpeg = await sharp(path.resolve('public/demo', `tokokita-${slugs[i]}-1.webp`)).resize(k.ukuran, k.ukuran, { fit: 'cover' }).jpeg({ quality: 82 }).toBuffer();
    const b = k.ukuran + 20;
    isi += `<g transform="translate(${k.x} ${k.y}) rotate(${k.putar} ${b / 2} ${b / 2})" filter="url(#bayang)"><rect width="${b}" height="${b}" rx="34" fill="#fff"/><clipPath id="c${i}"><rect x="10" y="10" width="${k.ukuran}" height="${k.ukuran}" rx="26"/></clipPath><image x="10" y="10" width="${k.ukuran}" height="${k.ukuran}" clip-path="url(#c${i})" href="data:image/jpeg;base64,${jpeg.toString('base64')}"/></g>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="600" viewBox="0 0 1600 600"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${dari}"/><stop offset="1" stop-color="${ke}"/></linearGradient><radialGradient id="cahaya" cx="0.8" cy="0.4" r="0.6"><stop offset="0" stop-color="#fff" stop-opacity="0.22"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient><filter id="bayang" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="22" stdDeviation="24" flood-color="#000" flood-opacity="0.38"/></filter></defs><rect width="1600" height="600" fill="url(#g)"/><rect width="1600" height="600" fill="url(#cahaya)"/>${isi}</svg>`;
}

function ilustrasiKategori(slug: string, nama: string): string {
  const { latar, aksen, gelap } = PALET[KELOMPOK[slug] ?? (slug.includes('elektronik') ? 'elektronik' : 'fashion')];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${aksen}"/><stop offset="1" stop-color="${gelap}"/></linearGradient></defs>
    <rect width="800" height="800" fill="${latar}"/><circle cx="400" cy="340" r="210" fill="url(#g)"/>${taruh(IKON_KATEGORI[slug] ?? 'Shapes', 400 - 130, 340 - 130, 260, '#ffffff', 1.3)}
    <text x="400" y="650" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="52" font-weight="700" fill="#0F172A">${hindari(nama)}</text></svg>`;
}

async function tulis(url: string, svg: string) {
  const berkas = path.resolve('public', url.replace(/^\//, ''));
  await mkdir(path.dirname(berkas), { recursive: true });
  await writeFile(berkas, await sharp(Buffer.from(svg)).webp({ quality: 82 }).toBuffer());
}

async function main() {
  const db = new PrismaClient({ adapter: new PrismaMariaDb(konfigurasiDb(process.env)) });
  const [gambar, banner, kategori] = await Promise.all([
    db.productImage.findMany({ where: { url: { startsWith: '/demo/tokokita-' } }, select: { url: true, product: { select: { slug: true, name: true, brand: true, category: { select: { name: true, slug: true } } } } } }),
    db.banner.findMany({ where: { image: { startsWith: '/demo/tokokita-' } }, select: { image: true } }),
    db.category.findMany({ where: { image: { startsWith: '/demo/tokokita-' } }, select: { slug: true, name: true, image: true } }),
  ]);
  let jumlah = 0;
  const buatProduk = process.argv.includes('--produk');
  for (const g of buatProduk ? gambar : []) {
    const n = Number(/-(\d+)\.webp$/.exec(g.url)?.[1] ?? 1);
    const p = g.product;
    await tulis(g.url, ilustrasiProduk(Math.min(n, 3), { nama: p.name, merek: p.brand, kategori: p.category.name, ikon: IKON_PRODUK[p.slug] ?? 'Package', kelompok: KELOMPOK[p.category.slug] ?? 'fashion' }));
    jumlah++;
  }
  for (const b of banner) { await tulis(b.image, await ilustrasiBanner(/banner-([a-z]+)-/.exec(b.image)?.[1] ?? 'diskon')); jumlah++; }
  for (const k of kategori) { await tulis(k.image!, ilustrasiKategori(k.slug, k.name)); jumlah++; }
  console.log(`Ilustrasi dibuat: ${jumlah} berkas di public/demo`);
  await db.$disconnect();
}
main().catch((e) => { console.error(e instanceof Error ? e.message : e); process.exit(1); });
