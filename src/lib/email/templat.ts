// Isi email (PRD §11). Setiap templat mengembalikan versi teks dan HTML; semua
// data dari pengguna di-escape sebelum masuk HTML.

export type IsiEmail = { subject: string; text: string; html: string };

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export function emailResetPassword({ nama, url }: { nama: string; url: string }): IsiEmail {
  const subject = 'Atur ulang password TokoKita';
  const text = [
    `Halo ${nama},`,
    '',
    'Kami menerima permintaan untuk mengatur ulang password akun TokoKita-mu.',
    'Buka link berikut untuk membuat password baru (berlaku 1 jam, hanya bisa dipakai sekali):',
    '',
    url,
    '',
    'Kalau kamu tidak meminta ini, abaikan email ini. Password-mu tidak berubah.',
    '',
    'Salam,',
    'TokoKita',
  ].join('\n');

  const n = escapeHtml(nama);
  const u = escapeHtml(url);
  const html = `<!doctype html>
<html lang="id"><body style="font-family:Arial,sans-serif;color:#18181b;line-height:1.5">
<p>Halo ${n},</p>
<p>Kami menerima permintaan untuk mengatur ulang password akun TokoKita-mu.</p>
<p><a href="${u}" style="display:inline-block;background:#18181b;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none">Buat password baru</a></p>
<p style="font-size:13px;color:#52525b">Link berlaku 1 jam dan hanya bisa dipakai sekali. Jika tombol tidak berfungsi, salin alamat ini ke browser:<br>${u}</p>
<p>Kalau kamu tidak meminta ini, abaikan email ini. Password-mu tidak berubah.</p>
<p>Salam,<br>TokoKita</p>
</body></html>`;

  return { subject, text, html };
}
