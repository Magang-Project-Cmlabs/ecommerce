'use server';
import { cekPromoSchema } from '@/lib/validations/checkout';
import { ambilPenggunaSaatIni } from '@/lib/data/pengguna';
import { ambilPromoCheckout } from '@/lib/data/checkout';
import { evaluasiPromo } from '@/lib/pesanan/promo';
export type HasilValidasiPromo = { ok: true; code: string; description: string; discount: number; type: 'PERCENT' | 'FIXED'; value: number; minSubtotal: number; maxDiscount: number | null } | { ok: false; message: string };
export async function cekKodePromo(kodeMentah: string, subtotal: number): Promise<HasilValidasiPromo> {
  const parsed = cekPromoSchema.safeParse({ code: kodeMentah, subtotal });
  if (!parsed.success) return { ok: false, message: typeof kodeMentah === 'string' && !kodeMentah.trim() ? 'Masukkan kode promo terlebih dahulu.' : typeof subtotal === 'number' && subtotal <= 0 ? 'Keranjang belanja masih kosong.' : 'Data promo tidak valid.' };
  try {
    const user = await ambilPenggunaSaatIni();
    const { promo, usage } = await ambilPromoCheckout(parsed.data.code, user?.id ?? null);
    const result = evaluasiPromo(promo, parsed.data.subtotal, usage);
    if (!result.ok || !promo) return result as { ok: false; message: string };
    return { ok: true, code: promo.code, description: promo.description, discount: result.discount, type: promo.type, value: promo.value, minSubtotal: promo.minSubtotal, maxDiscount: promo.maxDiscount };
  } catch { return { ok: false, message: 'Kode promo belum dapat diperiksa. Silakan coba kembali.' }; }
}
