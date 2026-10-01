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
