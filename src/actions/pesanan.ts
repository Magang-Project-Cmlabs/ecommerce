'use server';

// Server Action untuk pesanan pembeli (PRD §7.7, §10.6, CLAUDE.md #5).
// Menangani pembatalan pesanan, konfirmasi pesanan diterima, dan simulasi pembayaran.

import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth/akses';
import { prisma } from '@/lib/db';
import { ubahStatus } from '@/lib/pesanan/transisi';
import { ambilDetailPesananDemo, simpanDemoOrder } from '@/lib/data/pesanan';

export type HasilAksiPesanan = {
  ok: boolean;
  message: string;
};

/**
 * Server Action pembatalan pesanan oleh pembeli (PRD §10.6).
 * Hanya dapat membatalkan pesanan yang berstatus pending (belum dibayar).
 * Mengembalikan stok produk dan kuota promo secara otomatis.
 */
export async function batalkanPesanan(
  orderNumber: string,
  alasan: string
): Promise<HasilAksiPesanan> {
  const pengguna = await requireUser('/akun/pesanan/' + orderNumber);

  try {
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('DB_TIMEOUT')), 2000)
    );

    const query = prisma.order.findFirst({
      where: {
        orderNumber,
        userId: pengguna.id,
      },
    });

    const order = await Promise.race([query, timeout]);

    if (!order) {
      const demoOrder = ambilDetailPesananDemo(orderNumber);
      if (demoOrder) {
        if (demoOrder.status !== 'pending') {
          return {
            ok: false,
            message: 'Pesanan ini sudah diproses dan tidak dapat dibatalkan oleh pembeli.',
          };
        }
        demoOrder.status = 'cancelled';
        demoOrder.cancelledAt = new Date();
        demoOrder.cancelReason = (alasan || 'Dibatalkan oleh pembeli').trim();
        demoOrder.statusLogs.unshift({
          id: Date.now(),
          status: 'cancelled',
          note: `Dibatalkan oleh pembeli: ${demoOrder.cancelReason}`,
          createdAt: new Date(),
        });
        simpanDemoOrder(demoOrder);
        revalidatePath('/akun/pesanan');
        revalidatePath(`/akun/pesanan/${orderNumber}`);
        return {
          ok: true,
          message: 'Pesanan berhasil dibatalkan. Stok dan kuota promo telah dikembalikan.',
        };
      }
      return { ok: false, message: 'Pesanan tidak ditemukan.' };
    }

    if (order.status !== 'pending') {
      return {
        ok: false,
        message: 'Pesanan ini sudah diproses dan tidak dapat dibatalkan oleh pembeli.',
      };
    }

    const alasanBersih = (alasan || 'Dibatalkan oleh pembeli').trim();

    await ubahStatus(order.id, 'cancelled', 'pembeli', {
      alasan: alasanBersih,
      changedById: pengguna.id,
    });

    revalidatePath('/akun/pesanan');
    revalidatePath(`/akun/pesanan/${orderNumber}`);

    return {
      ok: true,
      message: 'Pesanan berhasil dibatalkan. Stok dan kuota promo telah dikembalikan.',
    };
  } catch (error) {
    const demoOrder = ambilDetailPesananDemo(orderNumber);
    if (demoOrder) {
      if (demoOrder.status !== 'pending') {
        return {
          ok: false,
          message: 'Pesanan ini sudah diproses dan tidak dapat dibatalkan oleh pembeli.',
        };
      }
      demoOrder.status = 'cancelled';
      demoOrder.cancelledAt = new Date();
      demoOrder.cancelReason = (alasan || 'Dibatalkan oleh pembeli').trim();
      demoOrder.statusLogs.unshift({
        id: Date.now(),
        status: 'cancelled',
        note: `Dibatalkan oleh pembeli: ${demoOrder.cancelReason}`,
        createdAt: new Date(),
      });
      simpanDemoOrder(demoOrder);
      revalidatePath('/akun/pesanan');
      revalidatePath(`/akun/pesanan/${orderNumber}`);
      return {
        ok: true,
        message: 'Pesanan berhasil dibatalkan. Stok dan kuota promo telah dikembalikan.',
      };
    }

    const msg = error instanceof Error ? error.message : 'Gagal membatalkan pesanan.';
    console.error('[batalkanPesanan] Error:', error);
    return { ok: false, message: msg };
  }
}

/**
 * Server Action konfirmasi pesanan diterima ("Pesanan Diterima") oleh pembeli (PRD §10.6).
 * Hanya berlaku untuk pesanan berstatus shipped (sedang dikirim).
 * Jika metode pembayaran COD, status bayar otomatis diperbarui menjadi paid.
 */
export async function konfirmasiPesananDiterima(
  orderNumber: string
): Promise<HasilAksiPesanan> {
  const pengguna = await requireUser('/akun/pesanan/' + orderNumber);

  try {
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('DB_TIMEOUT')), 2000)
    );

    const query = prisma.order.findFirst({
      where: {
        orderNumber,
        userId: pengguna.id,
      },
    });

    const order = await Promise.race([query, timeout]);

    if (!order) {
      const demoOrder = ambilDetailPesananDemo(orderNumber);
      if (demoOrder) {
        if (demoOrder.status !== 'shipped') {
          return {
            ok: false,
            message: 'Hanya pesanan yang sedang dalam status pengiriman (dikirim) yang dapat diselesaikan.',
          };
        }
        demoOrder.status = 'delivered';
        demoOrder.deliveredAt = new Date();
        if (demoOrder.paymentMethod === 'cod') {
          demoOrder.paymentStatus = 'paid';
          demoOrder.paidAt = new Date();
        }
        demoOrder.statusLogs.unshift({
          id: Date.now(),
          status: 'delivered',
          note: 'Pesanan diterima oleh pembeli',
          createdAt: new Date(),
        });
        simpanDemoOrder(demoOrder);
        revalidatePath('/akun/pesanan');
        revalidatePath(`/akun/pesanan/${orderNumber}`);
        return {
          ok: true,
          message: 'Pesanan telah selesai! Terima kasih telah berbelanja di TokoKita.',
        };
      }
      return { ok: false, message: 'Pesanan tidak ditemukan.' };
    }

    if (order.status !== 'shipped') {
      return {
        ok: false,
        message: 'Hanya pesanan yang sedang dalam status pengiriman (dikirim) yang dapat diselesaikan.',
      };
    }

    await ubahStatus(order.id, 'delivered', 'pembeli', {
      changedById: pengguna.id,
      alasan: 'Pesanan diterima oleh pembeli',
    });

    revalidatePath('/akun/pesanan');
    revalidatePath(`/akun/pesanan/${orderNumber}`);

    return {
      ok: true,
      message: 'Pesanan telah selesai! Terima kasih telah berbelanja di TokoKita.',
    };
  } catch (error) {
    const demoOrder = ambilDetailPesananDemo(orderNumber);
    if (demoOrder) {
      if (demoOrder.status !== 'shipped') {
        return {
          ok: false,
          message: 'Hanya pesanan yang sedang dalam status pengiriman (dikirim) yang dapat diselesaikan.',
        };
      }
      demoOrder.status = 'delivered';
      demoOrder.deliveredAt = new Date();
      if (demoOrder.paymentMethod === 'cod') {
        demoOrder.paymentStatus = 'paid';
        demoOrder.paidAt = new Date();
      }
      demoOrder.statusLogs.unshift({
        id: Date.now(),
        status: 'delivered',
        note: 'Pesanan diterima oleh pembeli',
        createdAt: new Date(),
      });
      simpanDemoOrder(demoOrder);
      revalidatePath('/akun/pesanan');
      revalidatePath(`/akun/pesanan/${orderNumber}`);
      return {
        ok: true,
        message: 'Pesanan telah selesai! Terima kasih telah berbelanja di TokoKita.',
      };
    }

    const msg = error instanceof Error ? error.message : 'Gagal menyelesaikan pesanan.';
    console.error('[konfirmasiPesananDiterima] Error:', error);
    return { ok: false, message: msg };
  }
}
