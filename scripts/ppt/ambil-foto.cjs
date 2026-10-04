// Foto profil GitHub publik anggota tim -> aset/foto-<akun>.png (bulat, 400 px) untuk slide "Anggota tim".
// Jalankan: node ambil-foto.cjs  (lalu bangun ulang PPT). Butuh internet. Akun tanpa foto memakai ikon bawaan GitHub.
const path = require('path');
const proyek = require('module').createRequire(path.join(__dirname, '..', '..', 'package.json'));
const sharp = proyek('sharp');

const AKUN = ['azridalimunthe7', 'astroceilo', 'kvnlhm', 'rizkikusnadi03', 'fikarnugraha18'];
const UKURAN = 400;
const topeng = Buffer.from(`<svg width="${UKURAN}" height="${UKURAN}"><circle cx="${UKURAN / 2}" cy="${UKURAN / 2}" r="${UKURAN / 2}" fill="#fff"/></svg>`);

(async () => {
  for (const akun of AKUN) {
    const res = await fetch(`https://github.com/${akun}.png?size=${UKURAN}`);
    if (!res.ok) throw new Error(`${akun}: HTTP ${res.status}`);
    const asli = Buffer.from(await res.arrayBuffer());
    // Latar putih untuk avatar transparan agar tetap terlihat bulat di kartu gelap maupun terang.
    await sharp(asli).flatten({ background: '#ffffff' }).resize(UKURAN, UKURAN, { fit: 'cover' }).ensureAlpha()
      .composite([{ input: topeng, blend: 'dest-in' }])
      .png({ compressionLevel: 9 })
      .toFile(path.join(__dirname, 'aset', `foto-${akun}.png`));
    console.log('tersimpan', `foto-${akun}.png`);
  }
})();
