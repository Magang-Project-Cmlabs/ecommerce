'use server';
import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth/akses';
import { cariPesananPembeli } from '@/lib/data/pesanan';
import { prisma } from '@/lib/db';
import { nomorPesananSchema } from '@/lib/validations/pesanan';
import { BusinessValidationError, pesanGalat } from '@/lib/pesanan/galat';
import { ubahStatus } from '@/lib/pesanan/transisi';
import { urlAplikasi } from '@/lib/url-aplikasi';
import { bacaKonfigMidtrans, buatKlienMidtrans, MidtransError, tentukanAksi } from '@/lib/payment';
export type HasilMulaiPembayaran = { ok: true; url: string } | { ok: false; message: string };
export async function mulaiPembayaran(orderNumber: string): Promise<HasilMulaiPembayaran> {
  const user = await requireUser('/akun/pesanan');
  if (!nomorPesananSchema.safeParse(orderNumber).success) return { ok: false, message: 'Nomor pesanan tidak valid.' };
  try {
    const client = buatKlienMidtrans(bacaKonfigMidtrans());
    // Serialize requests on this order. Gateway call has its own 10s deadline;
    // no stock/email side effects occur while the payment session is created.
    const url = await prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM orders WHERE order_number = ${orderNumber} AND user_id = ${user.id} FOR UPDATE`;
      const order = await tx.order.findFirst({ where: { orderNumber, userId: user.id }, include: { items: true, user: { select: { name: true, email: true, phone: true, deletedAt: true } } } });
      if (!order || order.user.deletedAt || order.status !== 'pending' || order.paymentStatus !== 'unpaid' || order.paymentMethod === 'cod' || !order.paymentDueAt || order.paymentDueAt <= new Date()) throw new BusinessValidationError('Pesanan tidak tersedia untuk pembayaran.');
      if (order.paymentUrl && order.paymentTransactionId) {
        try {
          const status = await client.ambilStatus(order.paymentTransactionId);
          if (!['deny', 'cancel', 'failure'].includes(status.transactionStatus)) return order.paymentUrl;
        } catch (error) {
          if (error instanceof MidtransError && error.httpStatus === 404) return order.paymentUrl;
          throw error;
        }
      }
      const session = await client.buatSesi({ nomorPesanan: order.orderNumber, percobaan: order.paymentAttempt + 1, metode: order.paymentMethod, items: order.items.map(i => ({ id: `${i.productId}:${i.variantId ?? 0}`, nama: `${i.name}${i.variantName ? ` (${i.variantName})` : ''}`, harga: i.price, jumlah: i.quantity })), ongkir: order.shippingCost, diskon: order.discount, grandTotal: order.grandTotal, dibuatPada: order.createdAt, batasBayar: order.paymentDueAt, pelanggan: { nama: order.user.name, email: order.user.email, telepon: order.user.phone ?? undefined }, urlSelesai: `${urlAplikasi(process.env)}/akun/pesanan/${order.orderNumber}` });
      const parsedUrl = new URL(session.urlBayar);
      if (parsedUrl.protocol !== 'https:' || !['app.sandbox.midtrans.com', 'app.midtrans.com'].includes(parsedUrl.hostname)) throw new Error('Invalid gateway URL');
      await tx.order.update({ where: { id: order.id }, data: { paymentAttempt: { increment: 1 }, paymentTransactionId: session.idTransaksi, paymentUrl: session.urlBayar } });
      return session.urlBayar;
    }, { isolationLevel: 'ReadCommitted', timeout: 25000, maxWait: 25000 });
    return { ok: true, url };
  } catch (error) { console.error('[payment] Gagal membuat sesi pembayaran.'); return { ok: false, message: pesanGalat(error, 'Pembayaran belum dapat dibuka. Silakan coba kembali atau hubungi toko.') }; }
}
export async function cekPembayaran(orderNumber: string): Promise<{ ok: boolean; message: string }> {
  const user = await requireUser('/akun/pesanan');
  if (!nomorPesananSchema.safeParse(orderNumber).success) return { ok: false, message: 'Nomor pesanan tidak valid.' };
  try {
    const order = await cariPesananPembeli(orderNumber, user.id);
    if (!order) return { ok: false, message: 'Pesanan tidak ditemukan.' };
    if (order.paymentStatus === 'paid') return { ok: true, message: 'Pembayaran sudah diterima.' };
    if (order.status !== 'pending' || order.paymentMethod === 'cod' || !order.paymentTransactionId) return { ok: false, message: 'Pesanan belum memiliki transaksi pembayaran aktif.' };
    const client = buatKlienMidtrans(bacaKonfigMidtrans());
    const status = await client.ambilStatus(order.paymentTransactionId);
    if (status.idTransaksi !== order.paymentTransactionId || status.jumlah !== order.grandTotal) throw new BusinessValidationError('Data pembayaran tidak cocok. Hubungi admin toko.');
    const decision = tentukanAksi(status);
    if (decision.jenis === 'konfirmasi') {
      await ubahStatus(order.id, 'confirmed', 'sistem', { gatewayVerified: true, paymentTransactionId: status.idTransaksi, paymentType: decision.paymentType });
      revalidatePath('/akun/pesanan'); revalidatePath(`/akun/pesanan/${orderNumber}`); revalidatePath(`/checkout/berhasil/${orderNumber}`); revalidatePath('/admin');
      return { ok: true, message: 'Pembayaran diterima dan pesanan dikonfirmasi.' };
    }
    if (decision.jenis === 'batalkan') {
      await ubahStatus(order.id, 'cancelled', 'sistem', { alasan: decision.alasan, gatewayExpiredTransactionId: status.idTransaksi });
      revalidatePath('/akun/pesanan'); revalidatePath(`/akun/pesanan/${orderNumber}`); revalidatePath(`/checkout/berhasil/${orderNumber}`);
      return { ok: false, message: 'Pembayaran kedaluwarsa. Pesanan dibatalkan dan stok dikembalikan.' };
    }
    return { ok: false, message: ['deny', 'cancel', 'failure'].includes(status.transactionStatus) ? 'Pembayaran belum berhasil. Coba Bayar Sekarang untuk percobaan baru.' : 'Pembayaran belum diterima. Selesaikan pembayaran di Midtrans sandbox.' };
  } catch (error) {
    if (error instanceof MidtransError && error.httpStatus === 404) return { ok: false, message: 'Pembayaran belum diterima. Pilih metode pembayaran di halaman Midtrans.' };
    return { ok: false, message: pesanGalat(error, 'Status pembayaran belum dapat diperiksa. Silakan coba kembali.') };
  }
}
