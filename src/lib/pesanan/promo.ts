export type PromoEvaluasi = { isActive: boolean; startsAt: Date; expiresAt: Date; quota: number | null; usedCount: number; perUserLimit: number; minSubtotal: number; type: 'PERCENT' | 'FIXED'; value: number; maxDiscount: number | null };
export function evaluasiPromo(promo: PromoEvaluasi | null, subtotal: number, usage: number, now = new Date()): { ok: true; discount: number } | { ok: false; message: string } {
  if (!promo?.isActive) return { ok: false, message: 'Kode promo tidak ditemukan atau tidak aktif.' };
  if (now < promo.startsAt) return { ok: false, message: 'Kode promo belum berlaku.' };
  if (now > promo.expiresAt) return { ok: false, message: 'Kode promo sudah kedaluwarsa.' };
  if (promo.quota !== null && promo.usedCount >= promo.quota) return { ok: false, message: 'Kuota penggunaan kode promo sudah habis.' };
  if (usage >= promo.perUserLimit) return { ok: false, message: 'Batas penggunaan kode promo per pengguna sudah tercapai.' };
  if (subtotal < promo.minSubtotal) return { ok: false, message: `Minimal belanja Rp ${promo.minSubtotal.toLocaleString('id-ID')} untuk menggunakan kode ini.` };
  let discount = promo.type === 'PERCENT' ? Math.floor(subtotal * promo.value / 100) : promo.value;
  if (promo.type === 'PERCENT' && promo.maxDiscount !== null) discount = Math.min(discount, promo.maxDiscount);
  return { ok: true, discount: Math.max(0, Math.min(discount, subtotal)) };
}
