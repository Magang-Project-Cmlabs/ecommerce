// Menyiapkan aset deck: tangkapan layar bersudut membulat + garis tipis, dan ikon lucide (PNG).
const path = require('path');
const fs = require('fs');
const proyek = require('module').createRequire(path.join(__dirname, '..', '..', 'package.json'));
const sharp = proyek('sharp');
const React = proyek('react');
const { renderToStaticMarkup } = proyek('react-dom/server');
const L = proyek('lucide-react');
const D = __dirname;
fs.mkdirSync(path.join(D, 'aset'), { recursive: true });

async function bulatkan(nama, radiusRasio = 0.022, garis = 'e6e6e6', lebarMaks = 2160) {
  const src = sharp(path.join(D, 'img', nama + '.png'));
  const m = await src.metadata();
  const skala = Math.min(1, lebarMaks / m.width);
  const w = Math.round(m.width * skala), h = Math.round(m.height * skala);
  const r = Math.round(Math.min(w, h) * radiusRasio * (w > h ? 1 : 2.2));
  const topeng = Buffer.from(`<svg width="${w}" height="${h}"><rect x="0" y="0" width="${w}" height="${h}" rx="${r}" ry="${r}" fill="#fff"/></svg>`);
  const bingkai = Buffer.from(`<svg width="${w}" height="${h}"><rect x="1.5" y="1.5" width="${w - 3}" height="${h - 3}" rx="${r}" ry="${r}" fill="none" stroke="#${garis}" stroke-width="3"/></svg>`);
  const isi = await src.resize(w, h).png().toBuffer();
  await sharp(isi).composite([{ input: topeng, blend: 'dest-in' }, { input: bingkai }]).png({ compressionLevel: 9 }).toFile(path.join(D, 'aset', nama + '.png'));
  return { w, h };
}

const IKON = ['ShoppingBag', 'LayoutDashboard', 'User', 'UserCog', 'Search', 'Layers', 'Database', 'Code', 'Palette', 'ShoppingCart', 'ListChecks', 'KeyRound', 'CreditCard', 'Sparkles', 'Server', 'Cloud', 'Mail', 'Image', 'Clock', 'ShieldCheck', 'Lock', 'Scale', 'Truck', 'Moon', 'Users', 'GitBranch', 'CircleCheck', 'Gauge', 'Bot', 'Store', 'Percent', 'MessageSquare', 'TriangleAlert', 'Rocket', 'Smartphone', 'Workflow', 'BadgeCheck', 'Ban', 'Globe'];

async function ikon(nama, warna, akhiran) {
  const Kom = L[nama];
  if (!Kom) throw new Error('ikon tidak ada: ' + nama);
  const svg = renderToStaticMarkup(React.createElement(Kom, { size: 256, color: '#' + warna, strokeWidth: 1.6 }));
  await sharp(Buffer.from(svg)).resize(256, 256).png().toFile(path.join(D, 'aset', `ikon-${nama}-${akhiran}.png`));
}

(async () => {
  const ukuran = {};
  for (const n of ['beranda', 'katalog', 'detail', 'checkout', 'admin-modal', 'asisten']) ukuran[n] = await bulatkan(n);
  ukuran['admin-gelap'] = await bulatkan('admin-gelap', 0.022, '2e2e2e');
  ukuran['hp-gelap'] = await bulatkan('hp-gelap', 0.06, '2e2e2e', 1170);
  for (const n of IKON) { await ikon(n, 'ffffff', 'putih'); await ikon(n, '0a0a0a', 'hitam'); }
  fs.writeFileSync(path.join(D, 'aset', 'ukuran.json'), JSON.stringify(ukuran, null, 1));
  console.log('aset siap', Object.keys(ukuran).length, 'gambar,', IKON.length * 2, 'ikon');
})().catch((e) => { console.error(e); process.exit(1); });
