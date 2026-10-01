import 'server-only';
import { cariPesananGateway } from '@/lib/data/pesanan';
import { ubahStatus } from '@/lib/pesanan/transisi';
import { BusinessValidationError } from '@/lib/pesanan/galat';
import { bacaKonfigMidtrans, buatKlienMidtrans, type DepsNotifikasi } from '@/lib/payment';
export function depsNotifikasiProduksi(): DepsNotifikasi {
  const config = bacaKonfigMidtrans();
  const client = buatKlienMidtrans(config);
  return {
    serverKey: config.serverKey,
    async cariPesanan(number) {
      const order = await cariPesananGateway(number);
      return order ? { nomorPesanan: order.orderNumber, status: order.status, paymentStatus: order.paymentStatus, metodeBayar: order.paymentMethod, grandTotal: order.grandTotal, idTransaksiAktif: order.paymentTransactionId } : null;
    },
    ambilStatus: id => client.ambilStatus(id),
    async konfirmasiBayar(number, info) {
      const order = await cariPesananGateway(number);
      if (!order || order.status !== 'pending') return false;
      try {
        await ubahStatus(order.id, 'confirmed', 'sistem', { gatewayVerified: true, paymentTransactionId: info.idTransaksi, paymentType: info.paymentType });
        return true;
      } catch (error) { if (error instanceof BusinessValidationError) return false; throw error; }
    },
    async batalkanOtomatis(number, reason, idTransaksi) {
      const order = await cariPesananGateway(number);
      if (!order || order.status !== 'pending' || !order.paymentTransactionId) return false;
      try { await ubahStatus(order.id, 'cancelled', 'sistem', { alasan: reason, gatewayExpiredTransactionId: idTransaksi }); return true; }
      catch (error) { if (error instanceof BusinessValidationError) return false; throw error; }
    },
    catat(level, message, data) { console[level](`[midtrans] ${message}`, data); },
  };
}
