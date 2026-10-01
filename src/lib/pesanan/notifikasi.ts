import 'server-only';
import { ambilEmailPesanan } from '@/lib/data/pesanan';
import { kirimEmail } from '@/lib/email';
import { LABEL_STATUS_PESANAN } from './status';
import { urlAplikasi } from '@/lib/url-aplikasi';
export async function kirimNotifikasiPesanan(id: number) {
  try {
    const order = await ambilEmailPesanan(id);
    if (!order || order.user.deletedAt) return;
    const subject = `Pesanan ${order.orderNumber}: ${LABEL_STATUS_PESANAN[order.status]}`;
    const text = [`Halo ${order.user.name},`, subject, `Total: Rp ${order.grandTotal.toLocaleString('id-ID')}`, order.trackingNumber ? `Nomor resi: ${order.trackingNumber}` : '', `${urlAplikasi(process.env)}/akun/pesanan/${order.orderNumber}`].filter(Boolean).join('\n');
    const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    await kirimEmail(order.user.email, { subject, text, html: `<div lang="id" style="white-space:pre-line">${escaped}</div>` });
  } catch { console.error('[pesanan] Email pesanan gagal; transaksi tetap tersimpan.'); }
}
