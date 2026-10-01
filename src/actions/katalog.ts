'use server';

import { revalidatePath, updateTag } from 'next/cache';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth/akses';
import { wishlistSchema, ulasanSchema } from '@/lib/validations/katalog';
import { bolehMengulas } from '@/lib/pesanan/ulasan';
import { verifikasiTokenGambar } from '@/lib/upload-token';
import { ambilItemUntukUlasan } from '@/lib/data/katalog';

class UlasanTidakSah extends Error {}

export async function simpanWishlist(input: unknown) {
  const pengguna = await requireUser('/wishlist');
  const valid = wishlistSchema.safeParse(input);
  if (!valid.success) return { success: false as const, message: 'Produk tidak sah.' };
  const { productId, simpan } = valid.data;
  try {
    await prisma.$transaction(async (tx) => {
      const produk = await tx.product.findFirst({ where: { id: productId, isActive: true }, select: { id: true } });
      if (!produk) throw new Error('Produk tidak tersedia.');
      if (simpan) await tx.wishlistItem.upsert({ where: { userId_productId: { userId: pengguna.id, productId } }, create: { userId: pengguna.id, productId }, update: {} });
      else await tx.wishlistItem.deleteMany({ where: { userId: pengguna.id, productId } });
    });
  } catch {
    return { success: false as const, message: 'Wishlist belum tersimpan. Coba lagi.' };
  }
  revalidatePath('/wishlist');
  return { success: true as const, message: simpan ? 'Disimpan ke wishlist' : 'Dihapus dari wishlist' };
}

export async function kirimUlasan(form: FormData) {
  const pengguna = await requireUser('/akun/pesanan');
  let uploadTokens: unknown;
  try {
    const raw = form.get('uploadTokens');
    if (raw !== null && (typeof raw !== 'string' || raw.length > 13000)) throw new Error();
    uploadTokens = JSON.parse(raw || '[]');
  } catch { return { success: false as const, message: 'Token foto tidak sah. Unggah foto kembali.' }; }
  const valid = ulasanSchema.safeParse({ orderItemId: form.get('orderItemId'), rating: form.get('rating'), content: form.get('content'), uploadTokens });
  if (!valid.success) return { success: false as const, message: valid.error.issues[0]?.message ?? 'Periksa ulasan Anda.' };
  if (form.getAll('foto').some((f) => f instanceof File && f.size > 0)) return { success: false as const, message: 'Unggah foto satu per satu sebelum mengirim ulasan.' };
  try {
    const item = await ambilItemUntukUlasan(valid.data.orderItemId, pengguna.id);
    if (!item) return { success: false as const, message: 'Item pesanan tidak ditemukan.' };
    const error = bolehMengulas({ userId: pengguna.id, pemilikId: item.order.userId, status: item.order.status, deliveredAt: item.order.deliveredAt, sudahDiulas: !!item.review });
    if (error) return { success: false as const, message: error };
    let images: string[];
    try { images = await verifikasiTokenGambar(valid.data.uploadTokens, pengguna.id, 'review', 3); }
    catch { return { success: false as const, message: 'Foto tidak sah atau kedaluwarsa. Silakan unggah kembali.' }; }
    const slug = await prisma.$transaction(async (tx) => {
      // Kunci baris produk: agregat rating dua ulasan bersamaan tetap konsisten.
      const product = await tx.product.update({ where: { id: item.productId }, data: { reviewCount: { increment: 0 } }, select: { slug: true } });
      const terkini = await tx.orderItem.findFirstOrThrow({ where: { id: item.id, order: { userId: pengguna.id } }, include: { order: { select: { userId: true, status: true, deliveredAt: true } }, review: { select: { id: true } } } });
      const alasan = bolehMengulas({ userId: pengguna.id, pemilikId: terkini.order.userId, status: terkini.order.status, deliveredAt: terkini.order.deliveredAt, sudahDiulas: !!terkini.review });
      if (alasan) throw new UlasanTidakSah(alasan);
      await tx.review.create({ data: { orderItemId: valid.data.orderItemId, rating: valid.data.rating, content: valid.data.content, images, productId: item.productId, userId: pengguna.id } });
      const ringkasan = await tx.review.aggregate({ where: { productId: item.productId }, _avg: { rating: true }, _count: { id: true } });
      await tx.product.update({ where: { id: item.productId }, data: { rating: Math.round((ringkasan._avg.rating ?? 0) * 10) / 10, reviewCount: ringkasan._count.id } });
      return product.slug;
    });
    updateTag('katalog-publik');
    revalidatePath(`/produk/${slug}`);
    revalidatePath('/akun/pesanan');
    return { success: true as const, message: 'Ulasan berhasil dikirim. Terima kasih!' };
  } catch (error) {
    return { success: false as const, message: error instanceof UlasanTidakSah ? error.message : 'Ulasan belum tersimpan. Coba lagi.' };
  }
}
