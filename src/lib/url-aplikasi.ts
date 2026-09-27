// Alamat dasar situs untuk link di email. Selalu dari APP_URL, tidak pernah
// dari header Host permintaan (header itu bisa dipalsukan untuk membelokkan
// link reset password ke situs penyerang).

export function urlAplikasi(env: { APP_URL?: string; NODE_ENV?: string }): string {
  const nilai = env.APP_URL?.trim();
  if (!nilai) {
    if (env.NODE_ENV === 'production') throw new Error('APP_URL wajib diisi di production');
    return 'http://localhost:3000';
  }
  let url: URL;
  try {
    url = new URL(nilai);
  } catch {
    throw new Error('APP_URL bukan URL yang sah');
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new Error('APP_URL harus http(s)');
  return url.origin + url.pathname.replace(/\/+$/, '');
}
