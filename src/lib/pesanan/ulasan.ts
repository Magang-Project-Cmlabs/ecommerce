export function bolehMengulas(item: {
  userId: number; pemilikId: number; status: string; deliveredAt: Date | null; sudahDiulas: boolean;
}, sekarang = new Date()): string | null {
  if (item.userId !== item.pemilikId) return 'Anda hanya dapat mengulas pesanan sendiri.';
  if (item.status !== 'delivered' || !item.deliveredAt) return 'Ulasan hanya untuk pesanan yang sudah selesai.';
  if (item.sudahDiulas) return 'Produk dari pesanan ini sudah diulas.';
  const usia = sekarang.getTime() - item.deliveredAt.getTime();
  if (usia < 0 || usia > 30 * 86400000) return 'Batas waktu menulis ulasan adalah 30 hari setelah pesanan selesai.';
  return null;
}
