// Membagi calon produk ke bagian-bagian beranda sesuai urutan tampil, tanpa mengulang
// produk yang sudah muncul di bagian sebelumnya.
export function bagiTanpaDuplikat<T extends { id: number }>(bagian: { kunci: string; calon: T[]; batas: number }[]): Record<string, T[]> {
  const sudahTampil = new Set<number>();
  const hasil: Record<string, T[]> = {};
  for (const { kunci, calon, batas } of bagian) {
    const terpilih = calon.filter((p) => !sudahTampil.has(p.id)).slice(0, batas);
    for (const p of terpilih) sudahTampil.add(p.id);
    hasil[kunci] = terpilih;
  }
  return hasil;
}

/** Privasi: nama depan + inisial belakang ("Budi Santoso" -> "Budi S."). */
export function samarkanNama(nama: string): string {
  const kata = nama.trim().split(/\s+/).filter(Boolean);
  if (kata.length === 0) return 'Pembeli';
  if (kata.length === 1) return kata[0]!;
  return `${kata[0]} ${kata[kata.length - 1]!.charAt(0).toUpperCase()}.`;
}

export type UlasanMentah = { id: number; productId: number; rating: number; content: string; userName: string; productName: string; productSlug: string };
export type UlasanBeranda = { id: number; rating: number; isi: string; nama: string; produk: string; slug: string };

const MIN_PANJANG = 40;
const MAKS_PANJANG = 220;

/** Ulasan pilihan untuk beranda: rating >= 4, tulisan cukup bermakna, satu per produk. Urutan masukan dipertahankan. */
export function pilihUlasanBeranda(daftar: UlasanMentah[], batas: number): UlasanBeranda[] {
  const produkTampil = new Set<number>();
  const hasil: UlasanBeranda[] = [];
  for (const u of daftar) {
    const isi = u.content.trim().replace(/\s+/g, ' ');
    if (u.rating < 4 || isi.length < MIN_PANJANG || produkTampil.has(u.productId)) continue;
    produkTampil.add(u.productId);
    hasil.push({ id: u.id, rating: u.rating, isi: isi.length > MAKS_PANJANG ? `${isi.slice(0, MAKS_PANJANG).trimEnd()}…` : isi, nama: samarkanNama(u.userName), produk: u.productName, slug: u.productSlug });
    if (hasil.length === batas) break;
  }
  return hasil;
}
