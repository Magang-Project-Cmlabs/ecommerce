// Eksekusi transaksi database mesin status pesanan (PRD §10.6, CLAUDE.md #8).
// Satu fungsi ubahStatus() yang dipakai semua jalur (action pembeli, action admin, webhook, cron).

import 'server-only';
import { prisma } from '@/lib/db';
import {
  transisiStatusBoleh,
  LABEL_STATUS_PESANAN,
  type OrderStatus,
  type PelakuTransisi,
} from './status';

export type DataTransisi = {
  alasan?: string;
  trackingNumber?: string;
  changedById?: number | null;
  paymentType?: string;
};

/**
 * Mengubah status pesanan secara aman dan atomic (PRD §10.6).
 * Mengembalikan objek pesanan terbaru beserta relasi items dan statusLogs.
 */
export async function ubahStatus(
  orderId: number,
  ke: OrderStatus,
  pelaku: PelakuTransisi,
  data?: DataTransisi
) {
  return await prisma.$transaction(async (tx) => {
    // 1. Ambil pesanan saat ini
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      throw new Error(`Pesanan dengan ID ${orderId} tidak ditemukan.`);
    }

    const dari = order.status;

    // 2. Periksa keabsahan transisi
    if (!transisiStatusBoleh(dari, ke, pelaku)) {
      throw new Error(
        `Transisi status tidak sah: dari "${dari}" ke "${ke}" oleh "${pelaku}".`
      );
    }

    // 3. Persiapkan perubahan data pesanan
    const updateData: Record<string, unknown> = {
      status: ke,
    };

    let logCatatan = data?.alasan ?? `Status diubah menjadi ${LABEL_STATUS_PESANAN[ke]}`;

    // Penanganan efek khusus per status
    if (ke === 'confirmed') {
      updateData.paymentStatus = 'paid';
      updateData.paidAt = new Date();
      if (data?.paymentType) {
        updateData.paymentType = data.paymentType;
      }
      logCatatan = 'Pembayaran terverifikasi dan pesanan dikonfirmasi';
    } else if (ke === 'shipped') {
      if (!data?.trackingNumber) {
        throw new Error('Nomor resi (tracking number) wajib diisi saat pesanan dikirim.');
      }
      updateData.trackingNumber = data.trackingNumber;
      updateData.shippedAt = new Date();
      logCatatan = `Pesanan dikirim dengan nomor resi ${data.trackingNumber}`;
    } else if (ke === 'delivered') {
      updateData.deliveredAt = new Date();
      if (order.paymentMethod === 'cod') {
        updateData.paymentStatus = 'paid';
        updateData.paidAt = new Date();
      }
      logCatatan =
        pelaku === 'pembeli'
          ? 'Pesanan telah diterima oleh pembeli'
          : 'Pesanan diselesaikan otomatis oleh sistem';
    } else if (ke === 'cancelled') {
      const alasanBatal = data?.alasan ?? 'Pesanan dibatalkan';
      updateData.cancelReason = alasanBatal;
      updateData.cancelledAt = new Date();
      if (order.paymentStatus === 'paid') {
        updateData.paymentStatus = 'refunded';
      }
      logCatatan = `Pesanan dibatalkan: ${alasanBatal}`;

      // 4. Pembatalan mengembalikan stok produk & varian
      for (const item of order.items) {
        if (item.variantId !== null) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { increment: item.quantity } },
          });
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: { increment: item.quantity },
              soldCount: { decrement: item.quantity },
            },
          });
        } else {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: { increment: item.quantity },
              soldCount: { decrement: item.quantity },
            },
          });
        }
      }

      // 5. Pembatalan mengembalikan kuota promo jika digunakan
      if (order.promoCode) {
        await tx.promoCode.update({
          where: { code: order.promoCode },
          data: { usedCount: { decrement: 1 } },
        });
        await tx.promoUsage.deleteMany({
          where: { orderId: order.id },
        });
      }
    }

    // 6. Update bersyarat untuk mencegah balapan (Race Condition Safe)
    const res = await tx.order.updateMany({
      where: { id: orderId, status: dari },
      data: updateData,
    });

    if (res.count !== 1) {
      throw new Error(
        'STATUS_BERUBAH: Status pesanan telah diubah oleh proses lain.'
      );
    }

    // 7. Catat ke tabel order_status_logs
    await tx.orderStatusLog.create({
      data: {
        orderId: order.id,
        status: ke,
        note: logCatatan,
        changedById: data?.changedById ?? null,
      },
    });

    return await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true, statusLogs: { orderBy: { createdAt: 'desc' } } },
    });
  });
}
