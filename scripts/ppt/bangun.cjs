// Generator deck TokoKita (diperbarui 3 Okt 2026, lihat README.md): tema monokrom seperti situs (hitam/putih/abu, aksen merah kecil),
// layout gelap untuk pembuka/sorotan/penutup, layout isi untuk slide lain. Jalankan: node bangun.cjs <keluar.pptx>
const fs = require('fs');
const path = require('path');
const pptxgen = require('pptxgenjs');
// applyTheme (nama tema + palet di XML) berasal dari skill pptx lokal dan tidak disalin ke repo.
// Isi PPTX_APPLY_THEME dengan path apply_theme.js bila tersedia; tanpa itu warna/font tetap sama
// karena setiap elemen menulis warna dan font sendiri.
const { applyTheme } = (() => { try { return process.env.PPTX_APPLY_THEME ? require(process.env.PPTX_APPLY_THEME) : {}; } catch { return {}; } })();
const ukuran = require('./aset/ukuran.json');
const A = (n) => path.join(__dirname, 'aset', n);
const KELUAR = process.argv[2] || path.join(__dirname, 'TokoKita.pptx');

const W = { tinta: '0A0A0A', putih: 'FFFFFF', ubin: 'F3F3F3', redup: '5C5C5C', garis: 'E6E6E6', merah: 'DC2626', gelap2: '171717', gelap3: '262626', abuGelap: 'A3A3A3' };
const H = 'Segoe UI Semibold', B = 'Segoe UI';
const THEME = { name: 'TokoKita Monokrom', headFontFace: H, bodyFontFace: B, colors: { dk1: W.tinta, lt1: W.putih, dk2: W.redup, lt2: W.ubin, accent1: W.tinta, accent2: W.merah, accent3: W.redup, accent4: W.abuGelap, accent5: W.garis, accent6: W.gelap2, hlink: W.tinta, folHlink: W.redup } };

const pres = new pptxgen();
pres.layout = 'LAYOUT_WIDE'; // 13.333 x 7.5 in
pres.title = 'TokoKita — Toko Online Mandiri';
pres.author = 'Tim Magang TokoKita';
pres.company = 'Magang Project Cmlabs';
pres.theme = { headFontFace: H, bodyFontFace: B };

pres.defineSlideMaster({
  title: 'ISI', background: { color: W.putih },
  objects: [
    { text: { text: 'TokoKita', options: { x: 0.6, y: 6.98, w: 2, h: 0.3, fontFace: H, fontSize: 11, color: W.tinta, margin: 0, isTextBox: true } } },
    { placeholder: { options: { name: 'judul', type: 'title', x: 0.6, y: 0.95, w: 12.1, h: 0.85, fontFace: H, fontSize: 30, color: W.tinta, align: 'left', valign: 'top', margin: 0 }, text: '' } },
  ],
  slideNumber: { x: 12.23, y: 6.98, w: 0.5, h: 0.3, fontFace: B, fontSize: 10, color: W.redup, align: 'right' },
});
pres.defineSlideMaster({
  title: 'GELAP', background: { color: W.tinta },
  objects: [{ placeholder: { options: { name: 'judul', type: 'title', x: 0.6, y: 0.95, w: 12.1, h: 0.85, fontFace: H, fontSize: 30, color: W.putih, align: 'left', valign: 'top', margin: 0 }, text: '' } }],
  slideNumber: { x: 12.23, y: 6.98, w: 0.5, h: 0.3, fontFace: B, fontSize: 10, color: W.abuGelap, align: 'right' },
});

// ---------- komponen ----------
const teks = (s, t, o) => s.addText(t, { fontFace: B, fontSize: 13, color: W.tinta, margin: 0, valign: 'top', isTextBox: true, ...o });
function pil(s, x, y, t, gelap = false) {
  const w = 0.4 + t.length * 0.098; // huruf kapital 9,5 pt + jarak huruf
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h: 0.32, rectRadius: 0.16, fill: { color: gelap ? W.gelap3 : W.ubin }, line: { type: 'none' } });
  teks(s, t.toUpperCase(), { x, y, w, h: 0.32, fontSize: 9.5, color: gelap ? 'D4D4D4' : W.redup, align: 'center', valign: 'middle', charSpacing: 1.5, fontFace: H });
}
const ubin = (s, x, y, w, h, warna = W.ubin) => s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.22, fill: { color: warna }, line: { type: 'none' } });
function lingkaranIkon(s, x, y, d, nama, gelap = true) {
  s.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color: gelap ? W.tinta : W.putih }, line: { type: 'none' } });
  const p = d * 0.25;
  s.addImage({ path: A(`ikon-${nama}-${gelap ? 'putih' : 'hitam'}.png`), x: x + p, y: y + p, w: d - 2 * p, h: d - 2 * p });
}
function gambar(s, nama, x, y, w) { const u = ukuran[nama]; const h = w * u.h / u.w; s.addImage({ path: A(nama + '.png'), x, y, w, h }); return h; }
function gambarTinggi(s, nama, x, y, h) { const u = ukuran[nama]; const w = h * u.w / u.h; s.addImage({ path: A(nama + '.png'), x, y, w, h }); return w; }
// Daftar bernomor (lingkaran angka + judul + keterangan) di kolom catatan tangkapan layar.
function catatanBernomor(s, x, y, w, butir, gelap = false) {
  butir.forEach(([judul, ket], i) => {
    const yy = y + i * 1.12;
    s.addShape(pres.shapes.OVAL, { x, y: yy, w: 0.42, h: 0.42, fill: { color: gelap ? W.putih : W.tinta }, line: { type: 'none' } });
    teks(s, String(i + 1), { x, y: yy, w: 0.42, h: 0.42, fontFace: H, fontSize: 12, color: gelap ? W.tinta : W.putih, align: 'center', valign: 'middle' });
    teks(s, judul, { x: x + 0.62, y: yy - 0.02, w: w - 0.62, h: 0.34, fontFace: H, fontSize: 15, color: gelap ? W.putih : W.tinta });
    teks(s, ket, { x: x + 0.62, y: yy + 0.34, w: w - 0.62, h: 0.62, fontSize: 12, color: gelap ? W.abuGelap : W.redup });
  });
}
function lencana(s, x, y, label, titik, w) {
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h: 0.42, rectRadius: 0.21, fill: { color: W.ubin }, line: { type: 'none' } });
  s.addShape(pres.shapes.OVAL, { x: x + 0.2, y: y + 0.16, w: 0.1, h: 0.1, fill: { color: titik }, line: { type: 'none' } });
  teks(s, label, { x: x + 0.38, y, w: w - 0.48, h: 0.42, fontFace: H, fontSize: 12, valign: 'middle' });
}
const isi = (bagian, eyebrow, judul) => { const s = pres.addSlide({ masterName: 'ISI', sectionTitle: bagian }); pil(s, 0.6, 0.45, eyebrow); s.addText(judul, { placeholder: 'judul' }); return s; };

// ---------- 1. Pembuka ----------
pres.addSection({ title: 'Pembuka' });
let s = pres.addSlide({ masterName: 'GELAP', sectionTitle: 'Pembuka' });
pil(s, 0.6, 0.55, 'Proyek magang kelompok · Full stack developer', true);
s.addText([{ text: 'TokoKita', options: { color: W.putih } }, { text: '.', options: { color: W.merah } }], { x: 0.6, y: 1.75, w: 6.2, h: 1.35, fontFace: H, fontSize: 66, margin: 0, isTextBox: true });
teks(s, 'Toko online mandiri untuk UMKM: dari rencana sampai berjalan online.', { x: 0.6, y: 3.2, w: 5.6, h: 1.1, fontSize: 22, color: W.abuGelap });
teks(s, [{ text: '5 anggota · ± 1 minggu · Next.js · Prisma · MySQL', options: { breakLine: true } }, { text: 'ecommerce-peach-seven-47.vercel.app', options: { color: W.putih } }], { x: 0.6, y: 5.55, w: 5.8, h: 0.8, fontSize: 13, color: W.abuGelap, paraSpaceAfter: 6 });
gambar(s, 'beranda', 6.95, 0.95, 5.8);
gambarTinggi(s, 'hp-gelap', 6.25, 3.25, 3.75);
s.addNotes('Perkenalkan tim dan tujuan presentasi: TokoKita adalah toko online mandiri yang kami bangun dari PRD sampai berjalan online di Vercel. Tunjukkan bahwa situs ini nyata dan bisa dibuka sekarang, dalam mode terang maupun gelap.');

// ---------- 2. Anggota tim (hanya nama; ketua lebih dulu, lalu urut abjad) ----------
s = isi('Pembuka', 'Anggota tim', 'Tim di balik TokoKita');
// Foto = avatar GitHub publik (aset/foto-<akun>.png dari ambil-foto.cjs).
[['Azrian Dalimunthe', 'azridalimunthe7', true], ['Doni Anggara', 'astroceilo'], ['Kevin Ilham', 'kvnlhm'], ['Rizki Kusnadi', 'rizkikusnadi03'], ['Zulfikar Satya Nugraha', 'fikarnugraha18']]
  .forEach(([nama, akun, ketua], i) => {
    const x = 0.6 + i * 2.48, gelap = !!ketua;
    ubin(s, x, 2.05, 2.3, 4.5, gelap ? W.tinta : W.ubin);
    s.addImage({ path: A(`foto-${akun}.png`), x: x + 0.5, y: 2.75, w: 1.3, h: 1.3, altText: `Foto profil ${nama}` });
    // Garis tepi agar avatar berlatar terang (ikon bawaan GitHub) tetap terlihat bulat di kartu abu.
    s.addShape(pres.shapes.OVAL, { x: x + 0.5, y: 2.75, w: 1.3, h: 1.3, fill: { color: W.putih, transparency: 100 }, line: { color: gelap ? W.gelap3 : 'D4D4D4', width: 1.5 } });
    teks(s, nama, { x: x + 0.2, y: 4.35, w: 1.9, h: 0.75, fontFace: H, fontSize: 16, color: gelap ? W.putih : W.tinta, align: 'center', valign: 'top' });
    if (ketua) pil(s, x + 0.51, 5.0, 'Ketua tim', true);
  });
s.addNotes('Perkenalkan anggota satu per satu. Azrian Dalimunthe adalah ketua tim.');

// ---------- 3. Agenda ----------
s = isi('Pembuka', 'Agenda', 'Yang akan kami paparkan');
[['01', 'Latar & pengguna', 'Masalah yang diselesaikan dan siapa penggunanya'], ['02', 'Cakupan & hasil', 'Fitur yang selesai dan batasan proyek'], ['03', 'Teknologi & arsitektur', 'Stack, arsitektur, database, aturan bisnis'], ['04', 'Tampilan aplikasi', 'Beranda, katalog, checkout, admin, asisten AI'], ['05', 'Tim & cara kerja', 'Pembagian peran, alur Git, papan tugas'], ['06', 'Kualitas, keamanan & demo', 'Hasil uji, keamanan, risiko, skenario demo']]
  .forEach(([n, j, k], i) => { const x = 0.6 + (i % 3) * 4.15, y = 2.05 + Math.floor(i / 3) * 2.3; ubin(s, x, y, 3.85, 2.05); teks(s, n, { x: x + 0.35, y: y + 0.3, w: 1, h: 0.5, fontFace: H, fontSize: 26, color: W.redup }); teks(s, j, { x: x + 0.35, y: y + 0.95, w: 3.2, h: 0.4, fontFace: H, fontSize: 17 }); teks(s, k, { x: x + 0.35, y: y + 1.37, w: 3.2, h: 0.55, fontSize: 12, color: W.redup }); });
s.addNotes('Urutan presentasi: dari masalah dan pengguna, hasil yang dibangun, teknologi, tampilan aplikasi, cara tim bekerja, sampai hasil uji dan demo.');

// ---------- 4. Latar belakang ----------
pres.addSection({ title: 'Latar & cakupan' });
s = isi('Latar & cakupan', 'Latar belakang', 'Masalah berjualan di marketplace, dan jawabannya');
ubin(s, 0.6, 2.05, 5.95, 4.55);
teks(s, 'Tantangan di marketplace', { x: 0.95, y: 2.35, w: 5.3, h: 0.4, fontFace: H, fontSize: 17 });
[['Komisi terus naik', 'Potongan per transaksi menggerus margin UMKM.'], ['Data pembeli bukan milik penjual', 'Sulit membangun pelanggan setia.'], ['Perang harga', 'Produk disandingkan langsung dengan kompetitor.'], ['Ketergantungan platform', 'Akun di-suspend, penjualan langsung berhenti.']]
  .forEach(([j, k], i) => { teks(s, j, { x: 0.95, y: 3.0 + i * 0.88, w: 5.3, h: 0.32, fontFace: H, fontSize: 14 }); teks(s, k, { x: 0.95, y: 3.32 + i * 0.88, w: 5.3, h: 0.4, fontSize: 12.5, color: W.redup }); });
ubin(s, 6.78, 2.05, 5.95, 4.55, W.tinta);
s.addText([{ text: 'Solusi TokoKita', options: { color: W.putih } }, { text: '.', options: { color: W.merah } }], { x: 7.13, y: 2.35, w: 5.3, h: 0.4, fontFace: H, fontSize: 17, margin: 0, isTextBox: true });
[['Bebas komisi', 'Seluruh hasil penjualan masuk ke pemilik toko.'], ['Data pelanggan sendiri', 'Bisa mengirim promo dan voucher ke pelanggan setia.'], ['Etalase eksklusif', 'Hanya produk brand sendiri, tanpa iklan kompetitor.'], ['Pembelajaran nyata', 'Tim membangun sistem transaksi dari hulu ke hilir.']]
  .forEach(([j, k], i) => { teks(s, j, { x: 7.13, y: 3.0 + i * 0.88, w: 5.3, h: 0.32, fontFace: H, fontSize: 14, color: W.putih }); teks(s, k, { x: 7.13, y: 3.32 + i * 0.88, w: 5.3, h: 0.4, fontSize: 12.5, color: W.abuGelap }); });
s.addNotes('Jelaskan kenapa UMKM butuh toko online sendiri: komisi, kepemilikan data, perang harga, dan risiko suspend. Lalu tunjukkan jawaban TokoKita di sisi kanan.');

// ---------- 5. Pengguna ----------
s = isi('Latar & cakupan', 'Analisis kebutuhan', 'Dua pengguna utama TokoKita');
[[0.6, 'User', 'Pembeli', 'Usia 18–40 tahun · 90% belanja lewat HP', [['Kebutuhan', 'Cari barang cepat, foto jelas, checkout di bawah 3 menit.'], ['Kekhawatiran', 'Barang palsu, ongkir tidak jelas, stok ternyata habis.'], ['Fitur andalan', 'Pencarian + filter, ulasan pembeli asli, kode promo, asisten AI.']]],
 [6.78, 'UserCog', 'Admin toko', 'Pemilik atau staf operasional · bukan orang IT', [['Kebutuhan', 'Pantau omzet, stok menipis, dan input resi dengan mudah.'], ['Kekhawatiran', 'Cek mutasi bank manual dan salah kirim varian.'], ['Fitur andalan', 'Peringatan stok ≤ 5, ubah status sekali klik, tambah/edit di modal.']]]]
  .forEach(([x, ik, nama, sub, baris]) => {
    ubin(s, x, 2.05, 5.95, 4.55); lingkaranIkon(s, x + 0.35, 2.4, 0.7, ik);
    teks(s, nama, { x: x + 1.25, y: 2.42, w: 4.4, h: 0.38, fontFace: H, fontSize: 19 }); teks(s, sub, { x: x + 1.25, y: 2.8, w: 4.5, h: 0.3, fontSize: 11.5, color: W.redup });
    baris.forEach(([l, k], i) => { teks(s, l.toUpperCase(), { x: x + 0.35, y: 3.62 + i * 0.95, w: 5.2, h: 0.25, fontFace: H, fontSize: 9.5, color: W.redup, charSpacing: 1.5 }); teks(s, k, { x: x + 0.35, y: 3.9 + i * 0.95, w: 5.25, h: 0.55, fontSize: 13 }); });
  });
s.addNotes('Pembeli fokus pada kecepatan dan rasa percaya. Admin toko bukan orang IT, jadi panel admin dibuat sesederhana tampilan toko.');

// ---------- 6. Cakupan & hasil ----------
s = isi('Latar & cakupan', 'Ruang lingkup', 'Semua fitur MVP dan lanjutan sudah selesai');
const kolomCakupan = [
  ['MVP · selesai', W.tinta, W.putih, ['Katalog, cari & filter', 'Detail produk & varian', 'Keranjang & kode promo', 'Checkout 4 langkah', 'Ongkir sesuai berat', 'Akun & lupa password', 'Riwayat & status pesanan', 'Admin pesanan & produk', 'Email notifikasi', 'Batal otomatis 24 jam']],
  ['Lanjutan · selesai', W.ubin, W.tinta, ['Wishlist', 'Ulasan terverifikasi + foto', 'Admin promo & banner', 'Dashboard omzet & stok', 'Pembayaran Midtrans sandbox', 'Mode terang & gelap', 'Asisten AI "Tanya AI"', 'Ongkir per zona provinsi', 'Login Google', 'Cek resi di situs kurir']],
  ['Di luar cakupan', W.putih, W.redup, ['Pembayaran uang asli (butuh badan usaha)', 'Lacak resi otomatis (API berbayar, kode siap)', 'Tarif ongkir resmi ekspedisi', 'Aplikasi mobile']],
];
kolomCakupan.forEach(([j, bg, fg, butir], i) => {
  const x = 0.6 + i * 4.15;
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 2.05, w: 3.85, h: 4.55, rectRadius: 0.22, fill: { color: bg }, line: bg === W.putih ? { color: W.garis, width: 1 } : { type: 'none' } });
  teks(s, j, { x: x + 0.35, y: 2.32, w: 3.2, h: 0.36, fontFace: H, fontSize: 15, color: fg });
  teks(s, butir.map((b, k) => ({ text: b, options: { bullet: { code: i === 2 ? '2013' : '2713' }, breakLine: k < butir.length - 1 } })), { x: x + 0.35, y: 2.85, w: 3.3, h: 3.6, fontSize: 12.5, color: fg, paraSpaceAfter: 5 });
});
s.addNotes('Seluruh fitur MVP dan fitur lanjutan sudah jalan. Tambahan dari rencana awal: pembayaran sandbox, mode gelap, asisten AI, ongkir per zona provinsi, Login Google, dan tombol cek resi di situs kurir. Lacak resi otomatis sudah dikodekan tetapi belum diaktifkan karena API-nya berbayar sekitar Rp 15 per pengecekan. Resi di data demo dibuat acak, jadi situs kurir menjawab tidak ditemukan; hasil lacak muncul untuk resi kiriman asli.');

// ---------- 7. Teknologi ----------
pres.addSection({ title: 'Teknologi' });
s = isi('Teknologi', 'Teknologi', 'Tech stack dan alasan pemilihannya');
[['Layers', 'Next.js 16 (App Router)', 'Tampilan dan logika server dalam satu proyek TypeScript.'], ['Database', 'MySQL di Aiven', 'Stabil dan dikenal; cloud saat rilis, Laragon saat lokal.'], ['Workflow', 'Prisma 7', 'Query sebagai kode, migrasi, dan data demo.'],
 ['Palette', 'Tailwind 4 + shadcn/ui', 'Komponen seragam, responsif, mode terang/gelap.'], ['ShoppingCart', 'Zustand', 'Keranjang tersimpan di browser walau halaman dimuat ulang.'], ['ListChecks', 'React Hook Form + Zod', 'Validasi yang sama di form dan di server.'],
 ['KeyRound', 'Argon2id + JWT', 'Password di-hash modern; sesi di cookie httpOnly.'], ['CreditCard', 'Midtrans Snap (sandbox)', 'Bayar QRIS, BCA, Mandiri; tanpa SDK, cukup fetch.'], ['Sparkles', 'Gemini + Groq', 'Asisten AI gratis tanpa kartu, cadangan otomatis.']]
  .forEach(([ik, j, k], i) => { const x = 0.6 + (i % 3) * 4.15, y = 2.05 + Math.floor(i / 3) * 1.55; ubin(s, x, y, 3.85, 1.37); lingkaranIkon(s, x + 0.25, y + 0.3, 0.6, ik); teks(s, j, { x: x + 1.05, y: y + 0.22, w: 2.65, h: 0.36, fontFace: H, fontSize: 14 }); teks(s, k, { x: x + 1.05, y: y + 0.6, w: 2.65, h: 0.65, fontSize: 11.5, color: W.redup }); });
s.addNotes('Semua dipilih agar tim cepat produktif: satu proyek, satu bahasa (TypeScript), komponen siap pakai. Argon2id menggantikan bcrypt; asisten AI memakai Gemini dengan cadangan Groq.');

// ---------- 8. Arsitektur ----------
s = isi('Teknologi', 'Arsitektur sistem', 'Bagaimana semua bagian terhubung');
ubin(s, 0.6, 2.05, 2.35, 3.0);
teks(s, 'PENGGUNA', { x: 0.85, y: 2.3, w: 2, h: 0.25, fontFace: H, fontSize: 9.5, color: W.redup, charSpacing: 1.5 });
[['User', 'Pembeli'], ['UserCog', 'Admin toko']].forEach(([ik, l], i) => { lingkaranIkon(s, 0.85, 2.75 + i * 1.0, 0.6, ik); teks(s, l, { x: 1.55, y: 2.85 + i * 1.0, w: 1.3, h: 0.4, fontFace: H, fontSize: 13 }); });
const panah = (x1, y1, x2, y2) => s.addShape(pres.shapes.LINE, { x: x1, y: y1, w: x2 - x1, h: y2 - y1, line: { color: W.redup, width: 1.5, endArrowType: 'triangle' } });
panah(3.05, 3.55, 3.5, 3.55);
s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 3.6, y: 2.05, w: 5.4, h: 3.0, rectRadius: 0.22, fill: { color: W.tinta }, line: { type: 'none' } });
teks(s, 'APLIKASI NEXT.JS · VERCEL (SIN1)', { x: 3.9, y: 2.3, w: 5, h: 0.25, fontFace: H, fontSize: 9.5, color: W.abuGelap, charSpacing: 1.5 });
[['Halaman', 'Server Components: beranda, katalog, akun, admin'], ['Server Actions', 'Satu-satunya jalur ubah data: login, checkout, promo, status, asisten'], ['Route Handler', '/api/search · /api/cron/orders · /api/payment/midtrans']]
  .forEach(([j, k], i) => { teks(s, j, { x: 3.9, y: 2.75 + i * 0.72, w: 1.6, h: 0.3, fontFace: H, fontSize: 13, color: W.putih }); teks(s, k, { x: 5.55, y: 2.77 + i * 0.72, w: 3.25, h: 0.6, fontSize: 11, color: W.abuGelap }); });
panah(9.1, 3.55, 9.55, 3.55);
ubin(s, 9.65, 2.05, 3.08, 3.0);
teks(s, 'DATA', { x: 9.9, y: 2.3, w: 2, h: 0.25, fontFace: H, fontSize: 9.5, color: W.redup, charSpacing: 1.5 });
lingkaranIkon(s, 9.9, 2.75, 0.6, 'Database');
teks(s, 'Prisma 7 → MySQL', { x: 10.6, y: 2.75, w: 2.0, h: 0.3, fontFace: H, fontSize: 13 }); teks(s, 'Aiven, TLS terverifikasi', { x: 10.6, y: 3.05, w: 2.0, h: 0.3, fontSize: 11, color: W.redup });
teks(s, '15 tabel bisnis + 1 tabel pembatas percobaan. Harga & stok selalu dihitung ulang di server.', { x: 9.9, y: 3.65, w: 2.65, h: 1.2, fontSize: 11, color: W.redup });
teks(s, 'LAYANAN PENDUKUNG', { x: 0.6, y: 5.35, w: 4, h: 0.25, fontFace: H, fontSize: 9.5, color: W.redup, charSpacing: 1.5 });
[['Image', 'Vercel Blob', 'Gambar produk & ulasan'], ['Mail', 'Gmail SMTP', 'Invoice & reset password'], ['CreditCard', 'Midtrans', 'Snap sandbox + webhook'], ['Clock', 'Cron & backup', 'Pesanan tiap jam, backup harian'], ['Bot', 'Gemini + Groq', 'Asisten "Tanya AI"']]
  .forEach(([ik, j, k], i) => { const x = 0.6 + i * 2.45; ubin(s, x, 5.7, 2.28, 0.95); lingkaranIkon(s, x + 0.2, 5.88, 0.58, ik); teks(s, j, { x: x + 0.9, y: 5.86, w: 1.35, h: 0.3, fontFace: H, fontSize: 12 }); teks(s, k, { x: x + 0.9, y: 6.16, w: 1.35, h: 0.45, fontSize: 9.5, color: W.redup }); });
s.addNotes('Alur: pengguna membuka halaman, Next.js memproses di server Vercel Singapura, Prisma menerjemahkan ke MySQL Aiven. Semua perubahan data hanya lewat Server Actions. Layanan pendukung: Blob untuk gambar, Gmail untuk email, Midtrans sandbox, cron pesanan tiap jam (GitHub Actions, cadangan cron harian Vercel) dengan backup database harian terenkripsi, dan Gemini/Groq untuk asisten AI. Email dikirim di latar agar checkout tidak menunggu.');

// ---------- 9. Database ----------
s = isi('Teknologi', 'Rancangan database', '15 tabel MySQL dalam 4 kelompok');
[['Pengguna', ['users', 'addresses', 'password_reset_tokens']], ['Katalog', ['categories', 'products', 'product_images', 'product_variants', 'reviews', 'wishlist_items']], ['Transaksi', ['orders', 'order_items', 'order_status_logs', 'promo_codes', 'promo_usages']], ['Konten', ['banners']]]
  .forEach(([j, t], i) => { const x = 0.6 + i * 3.1; ubin(s, x, 2.05, 2.9, 3.0); teks(s, j, { x: x + 0.3, y: 2.3, w: 2.3, h: 0.36, fontFace: H, fontSize: 16 }); teks(s, `${t.length} tabel`, { x: x + 0.3, y: 2.68, w: 2.3, h: 0.28, fontSize: 11, color: W.redup }); teks(s, t.map((n, k) => ({ text: n, options: { breakLine: k < t.length - 1 } })), { x: x + 0.3, y: 3.1, w: 2.4, h: 1.85, fontFace: 'Consolas', fontSize: 11.5, paraSpaceAfter: 3 }); });
[['Harga disimpan INT', 'Rupiah tanpa desimal, berat dalam gram.'], ['Snapshot pesanan', 'Nama, harga & alamat disalin saat checkout.'], ['Stok per varian', 'Setiap ukuran/warna punya stok sendiri.'], ['+1 tabel infrastruktur', 'auth_rate_limits: batas login & asisten AI.']]
  .forEach(([j, k], i) => { const x = 0.6 + i * 3.1; teks(s, j, { x, y: 5.4, w: 2.9, h: 0.32, fontFace: H, fontSize: 13 }); teks(s, k, { x, y: 5.73, w: 2.9, h: 0.6, fontSize: 11.5, color: W.redup }); });
s.addNotes('Tunjukkan pengelompokan tabel. Tekankan aturan data: uang INT, snapshot pesanan, stok per varian. Satu tabel tambahan dipakai untuk membatasi percobaan login dan pertanyaan ke asisten AI.');

// ---------- 10. ERD (gambar dibangun dari prisma/schema.prisma oleh erd.cjs) ----------
s = isi('Teknologi', 'Entity relationship diagram', 'Relasi antar tabel (ERD)');
[['||', 'tepat satu'], ['o|', 'nol atau satu'], ['o<', 'nol atau banyak']].forEach(([sim, ket], i) => {
  const x = 7.35 + i * 1.82;
  teks(s, sim, { x, y: 1.12, w: 0.42, h: 0.3, fontFace: 'Consolas', fontSize: 13, color: W.tinta });
  teks(s, ket, { x: x + 0.42, y: 1.14, w: 1.38, h: 0.3, fontSize: 11, color: W.redup });
});
teks(s, 'PK kunci utama · FK kunci tamu · UQ unik · kolom lain diringkas', { x: 7.35, y: 1.48, w: 5.4, h: 0.28, fontSize: 10.5, color: W.redup });
gambar(s, 'erd', 0.6, 1.95, 12.13);
s.addNotes('Diagram dibuat otomatis dari schema.prisma, jadi selalu sama dengan database. Pusatnya users dan products: satu pengguna punya banyak alamat, pesanan, ulasan, dan wishlist; satu produk punya banyak foto, varian, dan item pesanan. order_items menyimpan salinan nama dan harga, dan satu item pesanan paling banyak satu ulasan. promo_usages mengunci satu promo per pesanan. banners berdiri sendiri. Tabel auth_rate_limits tidak digambar karena tidak berelasi.');

// ---------- 11. Status pesanan ----------
s = isi('Teknologi', 'Aturan bisnis', 'Alur status pesanan, dari dibuat sampai selesai');
const alur = [['Menunggu Pembayaran', 'F59E0B', 'Batas bayar 24 jam'], ['Dikonfirmasi', '3B82F6', 'Dibayar atau COD'], ['Dikemas', '8B5CF6', 'Admin menyiapkan barang'], ['Dikirim', '0EA5E9', 'Admin wajib input resi'], ['Selesai', '10B981', 'Pembeli terima / otomatis 7 hari']];
const lebarAlur = [2.35, 1.75, 1.4, 1.3, 1.25]; let xAlur = 0.6;
alur.forEach(([l, c, k], i) => { const w = lebarAlur[i], x = xAlur; lencana(s, x, 2.15, l, c, w); teks(s, k, { x: x + 0.05, y: 2.72, w: w + 0.6, h: 0.5, fontSize: 11.5, color: W.redup }); xAlur += w + 0.75; if (i < 4) panah(x + w + 0.1, 2.36, xAlur - 0.1, 2.36); });
lencana(s, 0.6, 3.5, 'Dibatalkan', 'EF4444', 1.8);
teks(s, 'Lewat batas bayar, oleh pembeli sebelum bayar, atau oleh admin (wajib alasan). Stok dan kuota promo selalu dikembalikan.', { x: 2.6, y: 3.53, w: 8.5, h: 0.6, fontSize: 12.5, color: W.redup });
[['Ban', 'Tanpa overselling', 'Stok dikurangi dalam satu transaksi, hanya jika stok cukup; diuji dua pembeli berebut stok terakhir.'], ['Scale', 'Harga dari server', 'Harga, berat, ongkir, dan diskon selalu dihitung ulang dari database.'], ['ListChecks', 'Jejak status', 'Setiap perubahan dicatat di order_status_logs untuk timeline pesanan.']]
  .forEach(([ik, j, k], i) => { const x = 0.6 + i * 4.15; ubin(s, x, 4.55, 3.85, 1.95); lingkaranIkon(s, x + 0.3, 4.85, 0.55, ik); teks(s, j, { x: x + 1.0, y: 4.9, w: 2.7, h: 0.36, fontFace: H, fontSize: 14 }); teks(s, k, { x: x + 0.3, y: 5.55, w: 3.3, h: 0.85, fontSize: 11.5, color: W.redup }); });
s.addNotes('Lencana dan warnanya sama persis dengan yang tampil di aplikasi. Jelaskan siapa yang mengubah tiap status; pesanan tidak dibayar 24 jam dibatalkan otomatis oleh cron.');

// ---------- 12–16. Tampilan aplikasi ----------
pres.addSection({ title: 'Tampilan aplikasi' });
function tampilan(eyebrow, judul, img, butir, kiri, catatan, gelapImg = false) {
  const s = isi('Tampilan aplikasi', eyebrow, judul);
  const wImg = 7.85, xImg = kiri ? 0.6 : 13.333 - 0.6 - wImg;
  gambar(s, img, xImg, 2.05, wImg);
  catatanBernomor(s, kiri ? 8.8 : 0.6, 2.15, 3.95, butir);
  s.addNotes(catatan);
  return s;
}
tampilan('Tampilan · beranda', 'Beranda bergaya modern, nyaman di HP', 'beranda', [['Hero foto penuh', 'Promo geser yang dikelola admin.'], ['Pencarian cerdas', 'Saran produk muncul setelah 2 huruf.'], ['Ubin kategori berfoto', 'Besar dan mudah disentuh.'], ['Mode terang & gelap', 'Tombol bulan/matahari, tanpa kedip.']], true, 'Desain mengikuti template Framer pilihan pemilik: monokrom, foto besar, tipografi tegas. Skor Lighthouse beranda di HP 98.');
tampilan('Tampilan · katalog', 'Katalog dengan filter yang bisa dicari', 'katalog', [['Filter lengkap', 'Kategori, harga, rating, merek, urutan.'], ['Pilihan bisa dicari', 'Ketik "fa" → Fashion Pria/Wanita.'], ['Kartu produk bersih', 'Label diskon, rating, harga coret.'], ['Grid atau daftar', 'Dengan pagination dan hasil kosong.']], false, 'Semua pilihan bawaan browser diganti komponen sendiri yang bisa dicari dan dipakai dengan keyboard.');
tampilan('Tampilan · detail produk', 'Detail produk yang transparan', 'detail', [['Galeri zoom', 'Foto dari beberapa sudut, bisa diperbesar.'], ['Varian interaktif', 'Stok ikut berubah; varian habis terkunci.'], ['Harga jelas', 'Harga coret, persentase hemat, PPN 11%.'], ['Ulasan terverifikasi', 'Hanya dari pembeli yang pesanannya selesai.']], true, 'Detail produk menjawab kekhawatiran pembeli: harga, stok, dan ulasan yang jujur.');
tampilan('Tampilan · checkout', 'Checkout 4 langkah, ongkir sesuai berat', 'checkout', [['Pelacak langkah', 'Alamat → Pengiriman → Pembayaran → Konfirmasi.'], ['Buku alamat', 'Pilih alamat tersimpan atau tambah baru.'], ['Ongkir otomatis', 'Dari total berat dan zona provinsi tujuan.'], ['Ringkasan jelas', 'Promo dan total akhir sebelum memesan.']], false, 'Checkout dipandu empat langkah. Harga dan ongkir dihitung ulang di server, angka dari browser hanya dipakai sebagai id dan jumlah.');
s = isi('Tampilan aplikasi', 'Tampilan · panel admin', 'Panel admin satu gaya dengan toko');
gambar(s, 'admin-gelap', 0.6, 2.05, 7.85);
gambar(s, 'admin-modal-potong', 5.35, 3.3, 3.25);
catatanBernomor(s, 8.8, 2.15, 3.95, [['Ringkasan harian', 'Pesanan hari ini, omzet 7 dan 30 hari.'], ['Peringatan stok', 'Produk dengan stok ≤ 5 ditandai.'], ['Tambah & edit di modal', 'Form tampil di atas daftar.'], ['Lencana status', 'Pil netral dengan titik warna.']]);
s.addNotes('Panel admin memakai bahasa visual yang sama dengan toko, terlihat di sini dalam mode gelap. Tambah dan edit produk, kategori, promo, banner muncul sebagai modal.');

// ---------- 17. Sorotan: mode gelap & asisten AI ----------
s = pres.addSlide({ masterName: 'GELAP', sectionTitle: 'Tampilan aplikasi' });
pil(s, 0.6, 0.45, 'Sorotan', true);
s.addText('Mode gelap dan asisten "Tanya AI"', { placeholder: 'judul' });
gambarTinggi(s, 'hp-gelap', 0.6, 2.05, 4.6);
gambarTinggi(s, 'asisten-panel', 3.05, 2.05, 4.6);
teks(s, 'Asisten belanja, bukan chatbot serba bisa', { x: 6.45, y: 2.1, w: 6.3, h: 0.45, fontFace: H, fontSize: 16, color: W.putih });
teks(s, ['Menjawab produk, harga, ongkir, pembayaran, dan pesanan dari data toko.', 'Menolak coding, PR, puisi, SQL, dan jailbreak: 16/16 uji ditolak.', 'Tanpa akses database atau alat; hanya membalas teks.', 'Data kartu, NIK, password disamarkan, tidak dikirim.', 'Dibatasi per pengguna/IP, harian, dan global.'].map((t, k, arr) => ({ text: t, options: { bullet: true, breakLine: k < arr.length - 1 } })), { x: 6.45, y: 2.8, w: 6.0, h: 3.6, fontSize: 14, color: 'D4D4D4', paraSpaceAfter: 10 });
s.addNotes('Mode gelap tersedia di seluruh toko dan admin. Asisten "Tanya AI" memakai Gemini dengan cadangan Groq, keduanya gratis tanpa kartu. Contoh di layar: rekomendasi produk dijawab dengan tautan, permintaan kode Python ditolak.');

// ---------- 18. Tim ----------
pres.addSection({ title: 'Tim & cara kerja' });
s = isi('Tim & cara kerja', 'Struktur tim', 'Pembagian modul kerja tim');
[['Arsitektur & data', ['Skema database & Prisma', 'Login & keamanan', 'Review Pull Request']], ['Frontend katalog', ['Beranda & banner', 'Pencarian & filter', 'Halaman detail produk']], ['Frontend transaksi', ['Keranjang (drawer)', 'Buku alamat', 'Checkout 4 langkah']], ['Backend pesanan', ['Ongkir & kode promo', 'Email notifikasi', 'Batal otomatis 24 jam']], ['Admin panel & QA', ['Dashboard & stok menipis', 'Status pesanan & resi', 'Uji di berbagai HP']]]
  .forEach(([peran, tugas], i) => { const x = 0.6 + i * 2.48; ubin(s, x, 2.05, 2.3, 4.5); teks(s, `0${i + 1}`, { x: x + 0.28, y: 2.3, w: 1, h: 0.5, fontFace: H, fontSize: 24, color: W.redup }); teks(s, peran, { x: x + 0.28, y: 3.0, w: 1.85, h: 0.7, fontFace: H, fontSize: 15 }); teks(s, tugas.map((t, k) => ({ text: t, options: { bullet: true, breakLine: k < tugas.length - 1 } })), { x: x + 0.28, y: 3.85, w: 1.85, h: 2.4, fontSize: 11.5, color: W.redup, paraSpaceAfter: 6 }); });
s.addNotes('Pekerjaan dibagi per modul PRD agar setiap bagian punya pemilik yang jelas dan kode jarang bentrok.');

// ---------- 19. Alur kerja ----------
s = isi('Tim & cara kerja', 'Alur kerja tim', 'Cara 5 orang bekerja tanpa kode bertabrakan');
teks(s, 'ALUR GIT & GITHUB', { x: 0.6, y: 2.1, w: 5, h: 0.25, fontFace: H, fontSize: 9.5, color: W.redup, charSpacing: 1.5 });
[['Branch fitur', 'feat/… atau fix/… dari develop'], ['Commit kecil', 'Satu commit untuk satu perubahan'], ['Pull Request', 'Deskripsi + tangkapan layar'], ['CI otomatis', 'Typecheck, lint, test, build, MySQL'], ['Review & merge', 'Ke develop; develop → main per tahap']]
  .forEach(([j, k], i) => { const y = 2.5 + i * 0.82; s.addShape(pres.shapes.OVAL, { x: 0.6, y, w: 0.42, h: 0.42, fill: { color: W.tinta }, line: { type: 'none' } }); teks(s, String(i + 1), { x: 0.6, y, w: 0.42, h: 0.42, fontFace: H, fontSize: 12, color: W.putih, align: 'center', valign: 'middle' }); teks(s, j, { x: 1.22, y: y - 0.02, w: 4.5, h: 0.3, fontFace: H, fontSize: 14 }); teks(s, k, { x: 1.22, y: y + 0.28, w: 4.5, h: 0.3, fontSize: 11.5, color: W.redup }); });
teks(s, 'PAPAN TUGAS TRELLO', { x: 6.78, y: 2.1, w: 5, h: 0.25, fontFace: H, fontSize: 9.5, color: W.redup, charSpacing: 1.5 });
['Rencana', 'Dikerjakan', 'Uji coba', 'Selesai'].forEach((l, i) => { const x = 6.78 + i * 1.5; ubin(s, x, 2.5, 1.38, 1.9); teks(s, l, { x: x + 0.15, y: 2.65, w: 1.1, h: 0.3, fontFace: H, fontSize: 12 }); [0, 1].forEach((k) => s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: x + 0.15, y: 3.1 + k * 0.55, w: 1.08, h: 0.42, rectRadius: 0.08, fill: { color: W.putih }, line: { type: 'none' } })); });
[['Users', 'Sinkronisasi 20 menit', 'Awal pekan, cek progres; kartu tertahan > 2 hari dibahas.'], ['GitBranch', 'Berpasangan FE–BE', 'Frontend & backend satu modul selalu berkoordinasi.'], ['BadgeCheck', 'Dokumentasi rutin', 'Status, progres, dan keputusan dicatat di docs/.']]
  .forEach(([ik, j, k], i) => { const y = 4.7 + i * 0.66; lingkaranIkon(s, 6.78, y, 0.48, ik); teks(s, j, { x: 7.4, y, w: 5.3, h: 0.28, fontFace: H, fontSize: 12.5 }); teks(s, k, { x: 7.4, y: y + 0.27, w: 5.3, h: 0.3, fontSize: 11, color: W.redup }); });
s.addNotes('Alur Git berbasis branch per fitur dan Pull Request dengan CI otomatis di GitHub Actions, papan Trello untuk tugas, serta kebiasaan tim yang menjaga kode tidak bertabrakan.');

// ---------- 20. Kualitas ----------
pres.addSection({ title: 'Kualitas & demo' });
s = isi('Kualitas & demo', 'Standar kualitas', 'Hasil uji yang terukur, 3 Oktober 2026');
[['98', 'Lighthouse beranda HP', 'Situs online, LCP 1,7 dtk'], ['551', 'Unit test lulus', '+ 34 tes integrasi MySQL'], ['88', 'Tes E2E browser lulus', 'Alur pembeli & admin nyata'], ['0', 'Pelanggaran aksesibilitas serius', 'axe, mode terang & gelap']]
  .forEach(([n, j, k], i) => { const x = 0.6 + i * 3.1, gelap = i === 0; ubin(s, x, 2.05, 2.9, 2.3, gelap ? W.tinta : W.ubin); teks(s, n, { x: x + 0.3, y: 2.25, w: 2.4, h: 0.95, fontFace: H, fontSize: 48, color: gelap ? W.putih : W.tinta }); teks(s, j, { x: x + 0.3, y: 3.28, w: 2.4, h: 0.55, fontFace: H, fontSize: 13, color: gelap ? W.putih : W.tinta }); teks(s, k, { x: x + 0.3, y: 3.82, w: 2.4, h: 0.35, fontSize: 11, color: gelap ? W.abuGelap : W.redup }); });
teks(s, 'TARGET PRD', { x: 0.6, y: 4.7, w: 4, h: 0.25, fontFace: H, fontSize: 9.5, color: W.redup, charSpacing: 1.5 });
[['Muat halaman < 2,5 dtk di 4G', 'Beranda 1,7 · katalog 2,3 · detail 2,2 dtk (HP diperlambat) ✓'], ['Checkout < 3 menit', 'Empat langkah; latihan demo otomatis 30 dtk ✓'], ['Tanpa overselling', 'Dua pembeli berebut stok terakhir: hanya satu berhasil ✓'], ['Layar mulai 360 px', 'Tanpa gulir mendatar, tombol ≥ 44 px ✓']]
  .forEach(([j, k], i) => { const x = 0.6 + (i % 2) * 6.18, y = 5.05 + Math.floor(i / 2) * 0.78; teks(s, j, { x, y, w: 5.9, h: 0.3, fontFace: H, fontSize: 12.5 }); teks(s, k, { x, y: y + 0.3, w: 5.9, h: 0.35, fontSize: 11, color: W.redup }); });
s.addNotes('Semua angka hasil pengujian nyata pada 3 Oktober 2026. Kecepatan diukur dengan Lighthouse dan HP yang diperlambat (Slow 4G). Pada mode simulasi Lighthouse, halaman detail masih sekitar 3 detik; ini catatan perbaikan lanjutan.');

// ---------- 21. Keamanan ----------
s = isi('Kualitas & demo', 'Keamanan & regulasi', 'Melindungi data pembeli dan transaksi toko');
[['ShieldCheck', 'Privasi data', 'UU PDP No. 27/2022', ['Data pembeli hanya untuk pengiriman', 'Persetujuan privasi saat daftar', 'Pengguna bisa menghapus akun']], ['Lock', 'Akun & hak akses', 'Login dan peran', ['Argon2id + Login Google (PKCE)', 'Login maks. 5 percobaan / 15 menit', 'Panel admin khusus peran admin']], ['Scale', 'Transaksi adil', 'Stok & pembayaran', ['Batas bayar 24 jam', 'Stok kembali saat batal', 'Webhook Midtrans dicek tanda tangannya']], ['Bot', 'Asisten AI aman', 'Pengaman berlapis', ['Topik ketat, tolak di luar toko', 'Tanpa akses database/alat', 'Rate limit + data sensitif disamarkan']]]
  .forEach(([ik, j, sub, butir], i) => { const x = 0.6 + i * 3.1, gelap = i === 3; ubin(s, x, 2.05, 2.9, 4.5, gelap ? W.tinta : W.ubin); lingkaranIkon(s, x + 0.3, 2.35, 0.6, ik, !gelap); teks(s, j, { x: x + 0.3, y: 3.15, w: 2.4, h: 0.36, fontFace: H, fontSize: 15, color: gelap ? W.putih : W.tinta }); teks(s, sub, { x: x + 0.3, y: 3.5, w: 2.4, h: 0.3, fontSize: 11, color: gelap ? W.abuGelap : W.redup }); teks(s, butir.map((t, k) => ({ text: t, options: { bullet: true, breakLine: k < butir.length - 1 } })), { x: x + 0.3, y: 4.0, w: 2.4, h: 2.4, fontSize: 11.5, color: gelap ? 'D4D4D4' : W.tinta, paraSpaceAfter: 6 }); });
s.addNotes('Kepatuhan UU PDP, keamanan akun dengan Argon2id dan pembatasan percobaan, Login Google dengan OAuth + PKCE (admin tetap wajib password), aturan transaksi yang adil, dan pengaman asisten AI.');

// ---------- 22. Risiko ----------
s = isi('Kualitas & demo', 'Manajemen risiko', 'Risiko yang diantisipasi dan hasilnya');
const kepala = (t) => ({ text: t, options: { fontFace: H, fontSize: 10.5, color: W.redup, fill: { color: W.ubin }, margin: [4, 8, 4, 8] } });
const sel = (t, o = {}) => ({ text: t, options: { fontSize: 11, color: W.tinta, margin: [5, 8, 5, 8], ...o } });
s.addTable([
  [kepala('RISIKO'), kepala('TINGKAT'), kepala('MITIGASI'), kepala('HASIL')],
  [sel('Anggota baru mengenal Next.js & Prisma', { fontFace: H }), sel('Tinggi'), sel('Workshop minggu 1, contoh kode per modul, panduan di docs/'), sel('Fitur MVP selesai tepat waktu')],
  [sel('Fitur terus bertambah (scope creep)', { fontFace: H }), sel('Tinggi'), sel('Fitur baru masuk Lanjutan, disetujui ketua tim'), sel('Lanjutan dikerjakan setelah MVP stabil')],
  [sel('Konflik kode saat penggabungan', { fontFace: H }), sel('Sedang'), sel('Branch per fitur, PR kecil, CI otomatis'), sel('CI hijau di setiap PR')],
  [sel('Stok terjual melebihi persediaan', { fontFace: H }), sel('Sedang'), sel('Transaksi database + pengurangan stok bersyarat'), sel('Teruji berebut stok terakhir')],
  [sel('Kuota/penyalahgunaan asisten AI', { fontFace: H }), sel('Sedang'), sel('Rate limit berlapis, topik ketat, cadangan Groq, tombol darurat'), sel('16/16 uji penyalahgunaan ditolak')],
  [sel('Data server hilang', { fontFace: H }), sel('Rendah'), sel('Backup harian terenkripsi, simpan 30 hari, uji restore'), sel('Backup otomatis berjalan; restore manual teruji')],
], { x: 0.6, y: 2.05, w: 12.13, colW: [3.3, 1.2, 4.3, 3.33], border: { type: 'solid', pt: 0.75, color: W.garis }, fontFace: B, valign: 'middle', rowH: 0.62 });
s.addNotes('Risiko terbesar ada di sisi tim, bukan teknis. Kolom Hasil menunjukkan bagaimana mitigasi itu berjalan sampai akhir proyek.');

// ---------- 23. Demo & rilis ----------
s = isi('Kualitas & demo', 'Demo & rilis', 'Skenario demo 7 menit dan lingkungan rilis');
teks(s, 'SKENARIO DEMO', { x: 0.6, y: 2.1, w: 5, h: 0.25, fontFace: H, fontSize: 9.5, color: W.redup, charSpacing: 1.5 });
['Pembeli mencari produk dan memilih varian', 'Checkout dengan kode HEMAT10 (min. Rp 100.000)', 'Admin konfirmasi bayar, kemas, input resi', 'Pembeli terima pesanan dan beri ulasan', 'Pesanan lewat batas bayar batal otomatis', 'Bonus: tanya asisten AI & ganti mode gelap']
  .forEach((t, i) => { const y = 2.5 + i * 0.66; s.addShape(pres.shapes.OVAL, { x: 0.6, y, w: 0.42, h: 0.42, fill: { color: i === 5 ? W.ubin : W.tinta }, line: { type: 'none' } }); teks(s, String(i + 1), { x: 0.6, y, w: 0.42, h: 0.42, fontFace: H, fontSize: 12, color: i === 5 ? W.tinta : W.putih, align: 'center', valign: 'middle' }); teks(s, t, { x: 1.22, y: y + 0.06, w: 5.2, h: 0.32, fontSize: 13 }); });
ubin(s, 6.78, 2.05, 5.95, 4.55, W.tinta);
teks(s, 'Lingkungan rilis', { x: 7.13, y: 2.35, w: 5.3, h: 0.4, fontFace: H, fontSize: 17, color: W.putih });
[['Rocket', 'Vercel (Singapura)', 'HTTPS otomatis, deploy setiap merge ke develop'], ['Database', 'Aiven MySQL', 'TLS terverifikasi; backup harian terenkripsi'], ['CreditCard', 'Midtrans sandbox', 'Diuji di situs online: BCA lunas otomatis via webhook'], ['Mail', 'Gmail SMTP · Vercel Blob', 'Email di latar; gambar lama ikut terhapus'], ['Globe', 'Data demo siap', '26 produk, 79 pesanan, akun admin & pembeli']]
  .forEach(([ik, j, k], i) => { const y = 2.95 + i * 0.7; lingkaranIkon(s, 7.13, y, 0.48, ik, false); teks(s, j, { x: 7.78, y: y - 0.02, w: 4.7, h: 0.28, fontFace: H, fontSize: 12.5, color: W.putih }); teks(s, k, { x: 7.78, y: y + 0.26, w: 4.7, h: 0.3, fontSize: 11, color: W.abuGelap }); });
s.addNotes('Demo memakai data awal agar toko tidak kosong. Pembayaran uang asli butuh akun Midtrans atas nama badan usaha, jadi demo memakai sandbox dan konfirmasi manual admin. Rekaman cadangan ada di docs/screenshots/demo-ppt. Pembayaran sandbox sudah diuji di situs online sampai lunas otomatis; QRIS masih tertunda di simulator Midtrans.');

// ---------- 24. Tautan ----------
s = isi('Kualitas & demo', 'Tautan proyek', 'Coba sendiri, lihat kodenya');
const URL_SITUS = 'https://ecommerce-peach-seven-47.vercel.app';
ubin(s, 0.6, 2.05, 5.95, 4.55, W.tinta);
lingkaranIkon(s, 0.95, 2.4, 0.7, 'Globe', false);
teks(s, 'Situs online', { x: 1.85, y: 2.42, w: 4.4, h: 0.38, fontFace: H, fontSize: 19, color: W.putih });
teks(s, 'Publik · Vercel Singapura', { x: 1.85, y: 2.8, w: 4.4, h: 0.3, fontSize: 11.5, color: W.abuGelap });
teks(s, [{ text: 'ecommerce-peach-seven-47.vercel.app', options: { hyperlink: { url: URL_SITUS, tooltip: 'Buka TokoKita' }, color: W.putih } }], { x: 0.95, y: 3.45, w: 5.3, h: 0.4, fontFace: H, fontSize: 16, color: W.putih });
teks(s, ['Beranda, katalog, checkout: tanpa login', 'Akun pembeli & admin demo: lihat docs/DEMO.md', 'Pembayaran memakai Midtrans sandbox, bukan uang asli'].map((t, k, arr) => ({ text: t, options: { bullet: true, breakLine: k < arr.length - 1 } })), { x: 0.95, y: 4.2, w: 5.3, h: 1.4, fontSize: 13, color: 'D4D4D4', paraSpaceAfter: 8 });
s.addShape(pres.shapes.LINE, { x: 0.95, y: 5.7, w: 5.25, h: 0, line: { color: W.gelap3, width: 1 } });
[['26', 'produk'], ['79', 'pesanan demo'], ['98', 'Lighthouse HP']].forEach(([n, l], i) => {
  const x = 0.95 + i * 1.8;
  teks(s, n, { x, y: 5.85, w: 1.7, h: 0.42, fontFace: H, fontSize: 22, color: W.putih });
  teks(s, l, { x, y: 6.25, w: 1.7, h: 0.25, fontSize: 10.5, color: W.abuGelap });
});
[['GitBranch', 'Repositori GitHub', 'github.com/Magang-Project-Cmlabs/ecommerce', 'https://github.com/Magang-Project-Cmlabs/ecommerce', 'Privat · akses diberikan atas permintaan'],
 ['ListChecks', 'Papan tugas Trello', 'trello.com/b/sqbn4ehi', 'https://trello.com/b/sqbn4ehi/tokokita-proyek-magang', 'Privat · anggota tim dan pembimbing'],
 ['BadgeCheck', 'Dokumentasi', 'docs/ di repositori', null, 'PRD, panduan mulai, status, uji mandiri, serah terima']]
  .forEach(([ik, j, tautan, url, ket], i) => {
    const y = 2.05 + i * 1.55;
    ubin(s, 6.78, y, 5.95, 1.37); lingkaranIkon(s, 7.05, y + 0.36, 0.6, ik);
    teks(s, j, { x: 7.9, y: y + 0.2, w: 4.6, h: 0.32, fontFace: H, fontSize: 14 });
    teks(s, [{ text: tautan, options: url ? { hyperlink: { url } } : {} }], { x: 7.9, y: y + 0.52, w: 4.6, h: 0.3, fontFace: 'Consolas', fontSize: 11.5, color: W.tinta });
    teks(s, ket, { x: 7.9, y: y + 0.86, w: 4.6, h: 0.3, fontSize: 11, color: W.redup });
  });
s.addNotes('Situs bisa dibuka siapa saja sekarang. Repositori GitHub dan papan Trello bersifat privat; minta akses ke ketua tim bila ingin melihat kode. Semua keputusan, status, dan panduan uji ada di folder docs/.');

// ---------- 25. Penutup ----------
pres.addSection({ title: 'Penutup' });
s = pres.addSlide({ masterName: 'GELAP', sectionTitle: 'Penutup' });
pil(s, 0.6, 0.55, 'Penutup', true);
s.addText([{ text: 'Terima kasih', options: { color: W.putih } }, { text: '.', options: { color: W.merah } }], { x: 0.6, y: 1.5, w: 9, h: 1.3, fontFace: H, fontSize: 60, margin: 0, isTextBox: true });
teks(s, 'TokoKita sudah berjalan online dan siap didemokan.', { x: 0.6, y: 2.85, w: 9, h: 0.5, fontSize: 20, color: W.abuGelap });
[['Fitur lengkap', 'MVP dan seluruh fitur lanjutan berjalan dengan data nyata.'], ['Tampilan modern', 'Gaya monokrom, mode terang & gelap, nyaman di HP.'], ['Teruji', 'Unit, integrasi, E2E, aksesibilitas, dan uji keamanan AI.'], ['Kolaborasi teratur', 'Branch per fitur, Pull Request, CI, dan papan Trello.']]
  .forEach(([j, k], i) => { const x = 0.6 + (i % 2) * 6.18, y = 4.0 + Math.floor(i / 2) * 1.15; teks(s, j, { x, y, w: 5.8, h: 0.35, fontFace: H, fontSize: 15, color: W.putih }); teks(s, k, { x, y: y + 0.38, w: 5.8, h: 0.5, fontSize: 12.5, color: W.abuGelap }); });
teks(s, 'Mohon masukan, saran, dan bimbingannya · Sesi tanya jawab', { x: 0.6, y: 6.55, w: 9, h: 0.35, fontSize: 12, color: W.abuGelap });
s.addNotes('Rangkum empat hal utama, lalu buka sesi tanya jawab. Siapkan situs online dan rekaman cadangan bila jaringan bermasalah.');

// stream() dipakai karena writeFile() di Node mengabaikan opsi compression (pptxgenjs 3.12).
pres.stream({ compression: true }).then(async (isi) => { fs.writeFileSync(KELUAR, isi); if (applyTheme) await applyTheme(KELUAR, THEME); console.log('tersimpan', KELUAR); });
