'use server';
import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth/akses';
import { cariPesananPembeli } from '@/lib/data/pesanan';
import { ubahStatus } from '@/lib/pesanan/transisi';
import { pesanGalat } from '@/lib/pesanan/galat';
import { batalPesananSchema, nomorPesananSchema } from '@/lib/validations/pesanan';
export type HasilAksiPesanan = { ok: boolean; message: string };
function refresh(number: string) { revalidatePath('/akun/pesanan'); revalidatePath(`/akun/pesanan/${number}`); revalidatePath(`/checkout/berhasil/${number}`); revalidatePath('/admin'); revalidatePath('/'); }
export async function batalkanPesanan(orderNumber: string, alasan: string): Promise<HasilAksiPesanan> {
  const user = await requireUser('/akun/pesanan');
  const input = batalPesananSchema.safeParse({ orderNumber, alasan });
  if (!input.success) return { ok: false, message: 'Nomor pesanan atau alasan pembatalan tidak valid.' };
  try {
    const order = await cariPesananPembeli(input.data.orderNumber, user.id);
    if (!order) return { ok: false, message: 'Pesanan tidak ditemukan.' };
    await ubahStatus(order.id, 'cancelled', 'pembeli', { changedById: user.id, alasan: input.data.alasan });
    refresh(orderNumber);
    return { ok: true, message: 'Pesanan dibatalkan. Stok dan kuota promo telah dikembalikan.' };
  } catch (error) { return { ok: false, message: pesanGalat(error, 'Pesanan belum dapat dibatalkan. Silakan coba kembali.') }; }
}
export async function konfirmasiPesananDiterima(orderNumber: string): Promise<HasilAksiPesanan> {
  const user = await requireUser('/akun/pesanan');
  if (!nomorPesananSchema.safeParse(orderNumber).success) return { ok: false, message: 'Nomor pesanan tidak valid.' };
  try {
    const order = await cariPesananPembeli(orderNumber, user.id);
    if (!order) return { ok: false, message: 'Pesanan tidak ditemukan.' };
    await ubahStatus(order.id, 'delivered', 'pembeli', { changedById: user.id });
    refresh(orderNumber);
    return { ok: true, message: 'Pesanan selesai. Terima kasih telah berbelanja di TokoKita.' };
  } catch (error) { return { ok: false, message: pesanGalat(error, 'Pesanan belum dapat diselesaikan. Silakan coba kembali.') }; }
}
