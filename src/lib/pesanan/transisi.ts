import 'server-only';
import { prisma } from '@/lib/db';
import { Prisma } from '@/generated/prisma/client';
import { transisiStatusBoleh, LABEL_STATUS_PESANAN, type OrderStatus, type PelakuTransisi } from './status';
import { BusinessValidationError, cobaUlangTransaksi, PaymentAttemptChangedError } from './galat';
import { jadwalkanNotifikasiPesanan } from './jadwal-notifikasi';
export type DataTransisi = { alasan?: string; trackingNumber?: string; changedById?: number | null; paymentType?: string; paymentTransactionId?: string; gatewayVerified?: boolean; gatewayExpiredTransactionId?: string };
export async function ubahStatus(orderId: number, ke: OrderStatus, pelaku: PelakuTransisi, data?: DataTransisi) {
  const result = await cobaUlangTransaksi(() => prisma.$transaction(async tx => {
    await tx.$queryRaw`SELECT id FROM orders WHERE id = ${orderId} FOR UPDATE`;
    const order = await tx.order.findUnique({ where: { id: orderId }, include: { items: true } });
    if (!order) throw new BusinessValidationError('Pesanan tidak ditemukan.');
    if (pelaku === 'pembeli' && (!data?.changedById || data.changedById !== order.userId)) throw new BusinessValidationError('Pesanan tidak ditemukan.');
    if (pelaku !== 'sistem') {
      const actor = data?.changedById ? await tx.user.findFirst({ where: { id: data.changedById, deletedAt: null }, select: { role: true } }) : null;
      if (!actor || (pelaku === 'admin' && actor.role !== 'admin')) throw new BusinessValidationError('Akses perubahan pesanan ditolak.');
    }
    if (pelaku === 'sistem' && ke === 'confirmed') {
      if (!data?.gatewayVerified) throw new BusinessValidationError('Pembayaran belum terverifikasi.');
      // Check the locked row: a session may have been replaced while the
      // webhook or polling request was fetching the gateway status.
      if (data.paymentTransactionId) {
        if (order.paymentTransactionId !== data.paymentTransactionId) throw new PaymentAttemptChangedError();
      } else {
        const simulasi = process.env.NODE_ENV !== 'production' && process.env.PAYMENT_SIMULATION_ENABLED === 'true' && order.paymentTransactionId === null;
        if (!simulasi) throw new PaymentAttemptChangedError();
      }
    }
    if (!transisiStatusBoleh(order.status, ke, pelaku)) throw new BusinessValidationError('Status pesanan telah berubah atau tindakan ini tidak diizinkan.');
    if (order.status === 'pending' && ke === 'cancelled' && order.paymentStatus !== 'unpaid') throw new BusinessValidationError('Pesanan yang sudah dibayar tidak dapat dibatalkan melalui tindakan ini.');
    const now = new Date();
    if (pelaku === 'sistem') {
      if (ke === 'cancelled') {
        if (data?.gatewayExpiredTransactionId) {
          if (order.paymentTransactionId !== data.gatewayExpiredTransactionId) throw new BusinessValidationError('Percobaan pembayaran sudah berubah.');
        } else if (!order.paymentDueAt || order.paymentDueAt >= now) throw new BusinessValidationError('Pesanan belum melewati batas pembayaran.');
      }
      if (ke === 'delivered' && (!order.shippedAt || now.getTime() - order.shippedAt.getTime() <= 7 * 86400000)) throw new BusinessValidationError('Pesanan belum memenuhi batas penyelesaian otomatis.');
    }
    const update: Prisma.OrderUpdateManyMutationInput = { status: ke };
    let note = data?.alasan?.trim() || `Status diubah menjadi ${LABEL_STATUS_PESANAN[ke]}`;
    if (ke === 'confirmed') {
      update.paymentStatus = 'paid'; update.paidAt = now;
      if (data?.paymentType) update.paymentType = data.paymentType;
      if (data?.paymentTransactionId) update.paymentTransactionId = data.paymentTransactionId;
      note = 'Pembayaran terverifikasi dan pesanan dikonfirmasi';
    }
    if (ke === 'shipped') {
      const tracking = data?.trackingNumber?.trim();
      if (!tracking || tracking.length > 50) throw new BusinessValidationError('Nomor resi wajib diisi, maksimal 50 karakter.');
      update.trackingNumber = tracking; update.shippedAt = now;
      note = `Pesanan dikirim dengan nomor resi ${tracking}`;
    }
    if (ke === 'delivered') {
      update.deliveredAt = now;
      if (order.paymentMethod === 'cod') { update.paymentStatus = 'paid'; update.paidAt = now; }
      note = pelaku === 'pembeli' ? 'Pesanan diterima oleh pembeli' : 'Pesanan diselesaikan otomatis setelah 7 hari';
    }
    if (ke === 'cancelled') {
      const reason = data?.alasan?.trim() || (pelaku === 'sistem' ? 'Batas pembayaran telah berakhir' : 'Dibatalkan oleh pembeli');
      if (order.status === 'confirmed' && !data?.alasan?.trim()) throw new BusinessValidationError('Alasan pembatalan wajib diisi.');
      if (reason.length > 200) throw new BusinessValidationError('Alasan pembatalan maksimal 200 karakter.');
      update.cancelReason = reason; update.cancelledAt = now;
      if (order.paymentStatus === 'paid') update.paymentStatus = 'refunded';
      note = `Pesanan dibatalkan: ${reason}`;
    }
    // Claim transition before any side effects: losing caller never restores twice.
    const claimed = await tx.order.updateMany({ where: { id: orderId, status: order.status }, data: update });
    if (claimed.count !== 1) throw new BusinessValidationError('Status pesanan telah diubah oleh proses lain.');
    if (ke === 'cancelled') {
      const productIds = [...new Set(order.items.map(i => i.productId))].sort((a, b) => a - b);
      if (productIds.length) await tx.$queryRaw`SELECT id FROM products WHERE id IN (${Prisma.join(productIds)}) ORDER BY id FOR UPDATE`;
      for (const item of order.items) {
        if (item.variantId !== null) await tx.productVariant.update({ where: { id: item.variantId }, data: { stock: { increment: item.quantity } } });
        await tx.product.update({ where: { id: item.productId }, data: { ...(item.variantId === null ? { stock: { increment: item.quantity } } : {}), soldCount: { decrement: item.quantity } } });
      }
      const variantProductIds = [...new Set(order.items.filter(i => i.variantId !== null).map(i => i.productId))];
      if (variantProductIds.length) {
        const sums = await tx.productVariant.groupBy({ by: ['productId'], where: { productId: { in: variantProductIds } }, _sum: { stock: true } });
        for (const sum of sums) await tx.product.update({ where: { id: sum.productId }, data: { stock: sum._sum.stock ?? 0 } });
      }
      if (order.promoCode) {
        const removed = await tx.promoUsage.deleteMany({ where: { orderId: order.id } });
        if (removed.count) await tx.promoCode.updateMany({ where: { code: order.promoCode, usedCount: { gte: removed.count } }, data: { usedCount: { decrement: removed.count } } });
      }
    }
    await tx.orderStatusLog.create({ data: { orderId, status: ke, note, changedById: pelaku === 'sistem' ? null : data?.changedById ?? null } });
    return tx.order.findUnique({ where: { id: orderId }, include: { items: true, statusLogs: { orderBy: [{ createdAt: 'desc' }, { id: 'desc' }] } } });
  }, { isolationLevel: 'ReadCommitted', timeout: 15000, maxWait: 10000 }));
  jadwalkanNotifikasiPesanan(orderId);
  return result;
}
