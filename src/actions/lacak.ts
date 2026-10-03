'use server';
// Lacak paket (D20): hanya pemilik pesanan atau admin, hanya pesanan yang sudah dikirim.
// Hasil disimpan 30 menit per kurir+resi agar kuota API tidak habis; galat sementara tidak disimpan.
import { unstable_cache } from 'next/cache';
import { requireUser } from '@/lib/auth/akses';
import { ambilResiPesanan } from '@/lib/data/pesanan';
import { catatBatasAuthDb } from '@/lib/data/batas-auth';
import { nomorPesananSchema } from '@/lib/validations/pesanan';
import { lacakResi, type HasilLacak } from '@/lib/pengiriman/lacak';

export type HasilLacakPesanan = HasilLacak | { status: 'dibatasi'; tungguDetik: number };

class GalatSementara extends Error {}

const lacakTersimpan = unstable_cache(async (kurir: string, resi: string) => {
  const hasil = await lacakResi(kurir, resi);
  if (hasil.status === 'gagal') throw new GalatSementara();
  return hasil;
}, ['lacak-resi-v1'], { revalidate: 1800 });

export async function lacakPesanan(orderNumber: string): Promise<HasilLacakPesanan> {
  const user = await requireUser('/akun/pesanan');
  if (!nomorPesananSchema.safeParse(orderNumber).success) return { status: 'tidak-ditemukan' };
  const order = await ambilResiPesanan(orderNumber, user.role === 'admin' ? null : user.id);
  if (!order?.trackingNumber || !['shipped', 'delivered'].includes(order.status)) return { status: 'tidak-ditemukan' };
  const batas = await catatBatasAuthDb(`lacak:u:${user.id}`, undefined, new Date(), { maks: 20, jendelaMs: 10 * 60 * 1000 });
  if (!batas.boleh) return { status: 'dibatasi', tungguDetik: batas.tungguDetik };
  try {
    return await lacakTersimpan(order.shippingMethod, order.trackingNumber);
  } catch {
    return { status: 'gagal' };
  }
}
