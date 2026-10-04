// ERD dari prisma/schema.prisma -> aset/erd.png (Graphviz `dot` harus ada di PATH).
// Hanya kolom kunci (PK, FK, unik) yang ditampilkan agar terbaca di slide; kolom lain diringkas "+N kolom".
// Jalankan: node erd.cjs  (lalu bangun ulang PPT)
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { imageSize } = require('image-size');

const SKEMA = path.join(__dirname, '..', '..', 'prisma', 'schema.prisma');
const ASET = path.join(__dirname, 'aset');
// Kelompok sama dengan slide "Rancangan database"; auth_rate_limits (infrastruktur, tanpa relasi) tidak digambar.
const KELOMPOK = {
  Pengguna: ['User', 'Address', 'PasswordResetToken'],
  Katalog: ['Category', 'Product', 'ProductImage', 'ProductVariant', 'Review', 'WishlistItem'],
  Transaksi: ['Order', 'OrderItem', 'OrderStatusLog', 'PromoCode', 'PromoUsage'],
  Konten: ['Banner'],
};

// ---------- baca skema ----------
const sumber = fs.readFileSync(SKEMA, 'utf8');
const model = {};
const namaModel = new Set([...sumber.matchAll(/^model (\w+) \{/gm)].map((x) => x[1]));
for (const [, nama, badan] of sumber.matchAll(/^model (\w+) \{([\s\S]*?)^\}/gm)) {
  const m = { nama, tabel: nama, kolom: [], relasi: [], idGabungan: [] };
  for (const mentah of badan.split('\n')) {
    const baris = mentah.replace(/\/\/.*$/, '').trim();
    if (!baris) continue;
    const peta = baris.match(/^@@map\("(\w+)"\)/); if (peta) { m.tabel = peta[1]; continue; }
    const idg = baris.match(/^@@id\(\[([^\]]+)\]\)/); if (idg) { m.idGabungan = idg[1].split(',').map((s) => s.trim()); continue; }
    if (baris.startsWith('@@')) continue;
    const [f, tipe] = baris.split(/\s+/);
    const rel = baris.match(/@relation\((?:"\w+",\s*)?fields:\s*\[(\w+)\],\s*references:\s*\[(\w+)\]/);
    if (rel) { m.relasi.push({ fk: rel[1], ref: rel[2], ke: tipe.replace('?', '') }); continue; }
    if (namaModel.has(tipe.replace(/[?[\]]/g, ''))) continue; // sisi balik relasi (Order[], Review?)
    const kol = (baris.match(/@map\("(\w+)"\)/) || [])[1] || f.replace(/[A-Z]/g, (h) => '_' + h.toLowerCase());
    m.kolom.push({ f, kol, opsional: tipe.endsWith('?'), pk: baris.includes('@id'), unik: baris.includes('@unique') });
  }
  model[nama] = m;
}
for (const m of Object.values(model)) for (const k of m.kolom) if (m.idGabungan.includes(k.f)) k.pk = true;

// ---------- tulis DOT ----------
const FONT = 'Segoe UI', FONT_TEBAL = 'Segoe UI Semibold';
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
function label(m) {
  const fk = new Set(m.relasi.map((r) => r.fk));
  const kunci = m.kolom.filter((k) => k.pk || k.unik || fk.has(k.f));
  const sisa = m.kolom.length - kunci.length;
  const baris = kunci.map((k) => {
    const tanda = [k.pk && 'PK', fk.has(k.f) && 'FK', !k.pk && k.unik && 'UQ'].filter(Boolean).join(' ');
    return `<TR><TD ALIGN="LEFT" PORT="${k.f}"><FONT FACE="Consolas" POINT-SIZE="11">${esc(k.kol)}</FONT></TD><TD ALIGN="RIGHT" PORT="${k.f}_kanan"><FONT POINT-SIZE="9" COLOR="#5C5C5C">${tanda}</FONT></TD></TR>`;
  });
  if (sisa > 0) baris.push(`<TR><TD ALIGN="LEFT" COLSPAN="2"><FONT POINT-SIZE="9.5" COLOR="#5C5C5C">+${sisa} kolom</FONT></TD></TR>`);
  return `<<TABLE BORDER="0" CELLBORDER="0" CELLSPACING="0" CELLPADDING="4" BGCOLOR="#F3F3F3" STYLE="ROUNDED">`
    + `<TR><TD ALIGN="LEFT" COLSPAN="2" BGCOLOR="#0A0A0A" STYLE="ROUNDED"><FONT FACE="${FONT_TEBAL}" POINT-SIZE="12" COLOR="#FFFFFF"> ${esc(m.tabel)} </FONT></TD></TR>`
    + baris.join('') + '</TABLE>>';
}

// Kategori sebaris dengan produk dan ulasan sebaris dengan item pesanan: diagram cukup 3 baris, pas di slide lebar.
const SEBARIS = [['Category', 'Product'], ['OrderItem', 'Review']];
const dot = ['digraph ERD {',
  `  graph [rankdir=TB, bgcolor="#FFFFFF", pad=0.15, nodesep=0.3, ranksep=0.45, splines=spline, fontname="${FONT}", newrank=true];`,
  `  node [shape=plain, fontname="${FONT}"];`,
  '  edge [color="#5C5C5C", penwidth=1.3, arrowsize=0.8, dir=both];'];
Object.entries(KELOMPOK).forEach(([judul, daftar], i) => {
  dot.push(`  subgraph cluster_${i} { label=<<FONT FACE="${FONT_TEBAL}" POINT-SIZE="12" COLOR="#5C5C5C">${judul.toUpperCase()}</FONT>>; labeljust=l; style="rounded,dashed"; color="#D4D4D4"; margin=12;`);
  for (const n of daftar) { if (!model[n]) throw new Error(`model ${n} tidak ada di skema`); dot.push(`    ${n} [label=${label(model[n])}];`); }
  dot.push('  }');
});
for (const m of Object.values(model)) {
  if (!Object.values(KELOMPOK).flat().includes(m.nama)) continue;
  for (const r of m.relasi) {
    const k = m.kolom.find((x) => x.f === r.fk);
    // Crow's foot: sisi induk || (tepat satu) atau o| bila FK boleh kosong; sisi anak o< (nol/banyak) atau o| bila FK unik.
    const ekor = k.opsional ? 'teeodot' : 'teetee', kepala = k.unik ? 'teeodot' : 'crowodot';
    // Pasangan sebaris (induk di kiri) dan relasi ke diri sendiri ditambatkan ke sisi kolom PK induk
    // agar garis pendek dan tidak tampak keluar dari kolom lain.
    let induk = r.ke, anak = `${m.nama}:${r.fk}`;
    if (r.ke === m.nama) { induk = `${r.ke}:${r.ref}:w`; anak += ':w'; }
    else if (SEBARIS.some((p) => p.includes(r.ke) && p.includes(m.nama))) { induk = `${r.ke}:${r.ref}_kanan:e`; anak += ':w'; }
    dot.push(`  ${induk} -> ${anak} [arrowtail=${ekor}, arrowhead=${kepala}];`);
  }
}
for (const p of SEBARIS) dot.push(`  { rank=same; ${p.join('; ')}; }`);
dot.push('}');

const fileDot = path.join(__dirname, 'render', 'erd.dot');
fs.mkdirSync(path.dirname(fileDot), { recursive: true });
fs.writeFileSync(fileDot, dot.join('\n'));
const keluar = path.join(ASET, 'erd.png');
execFileSync('dot', ['-Tpng', '-Gdpi=220', '-o', keluar, fileDot]);
const u = imageSize(fs.readFileSync(keluar));
const fileUkuran = path.join(ASET, 'ukuran.json');
const ukuran = JSON.parse(fs.readFileSync(fileUkuran, 'utf8'));
ukuran.erd = { w: u.width, h: u.height };
fs.writeFileSync(fileUkuran, JSON.stringify(ukuran, null, 1));
const jumlahRelasi = Object.values(model).filter((m) => Object.values(KELOMPOK).flat().includes(m.nama)).reduce((n, m) => n + m.relasi.length, 0);
console.log(`erd.png ${u.width}x${u.height}, ${Object.values(KELOMPOK).flat().length} tabel, ${jumlahRelasi} relasi`);
