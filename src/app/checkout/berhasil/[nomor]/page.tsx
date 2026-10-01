import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';
import { requireUser } from '@/lib/auth/akses';
import { ambilDetailPesanan } from '@/lib/data/pesanan';
import { formatRupiah } from '@/lib/format';
import { LABEL_STATUS_PESANAN, LABEL_STATUS_PEMBAYARAN } from '@/lib/pesanan/status';
import { Button } from '@/components/ui/button';
import CountdownTimer from '@/components/checkout/CountdownTimer';
import SalinTeksButton from '@/components/checkout/SalinTeksButton';

export const metadata: Metadata = { title: 'Pesanan Berhasil — TokoKita', robots: { index: false, follow: false } };
export default async function HalamanPesananBerhasil({ params }: { params: Promise<{ nomor: string }> }) {
  const pengguna = await requireUser('/checkout/berhasil');
  const { nomor } = await params;
  const order = await ambilDetailPesanan(nomor, pengguna.id);
  if (!order) notFound();
  const address = order.shippingAddress;
  return <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
    <div className="mb-8 text-center"><CheckCircle2 className="mx-auto mb-4 size-14 text-green-700" /><h1 className="text-2xl font-bold">Pesanan Berhasil Dibuat!</h1><p className="mt-2 text-muted-foreground">Terima kasih telah berbelanja di TokoKita.</p></div>
    <section className="rounded-xl border bg-card p-6 shadow-sm" aria-label="Ringkasan pesanan">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4"><div><p className="text-sm text-muted-foreground">Nomor Pesanan</p><p className="break-all font-semibold">{order.orderNumber}</p><SalinTeksButton textToCopy={order.orderNumber} label="Salin Nomor" /></div><p className="text-2xl font-bold text-orange-700">{formatRupiah(order.grandTotal)}</p></div>
      <p className="mt-4 font-medium">{LABEL_STATUS_PESANAN[order.status]} · {LABEL_STATUS_PEMBAYARAN[order.paymentStatus]}</p>
      {order.status === 'pending' && <div className="mt-4"><CountdownTimer paymentDueAt={order.paymentDueAt} isPaid={order.paymentStatus === 'paid'} /></div>}
      {order.paymentMethod === 'cod' ? <p className="mt-4">Bayar kepada kurir saat pesanan diterima.</p> : <p className="mt-4">Buka detail pesanan untuk membayar atau melihat instruksi pembayaran. Pembayaran manual diverifikasi oleh admin.</p>}
      <h2 className="mb-2 mt-6 text-lg font-semibold">Barang yang Dipesan</h2><ul className="divide-y">{order.items.map(item => <li className="flex justify-between gap-4 py-3" key={item.id}><span>{item.name}{item.variantName ? ` — ${item.variantName}` : ''} × {item.quantity}</span><span className="shrink-0 tabular-nums">{formatRupiah(item.price * item.quantity)}</span></li>)}</ul>
      <dl className="mt-4 grid grid-cols-2 gap-2 border-t pt-4 text-sm"><dt>Subtotal</dt><dd className="text-right">{formatRupiah(order.subtotal)}</dd><dt>Ongkir</dt><dd className="text-right">{formatRupiah(order.shippingCost)}</dd><dt>Diskon</dt><dd className="text-right">−{formatRupiah(order.discount)}</dd></dl><p className="mt-2 text-sm text-muted-foreground">Harga sudah termasuk PPN.</p>
      <h2 className="mb-2 mt-6 text-lg font-semibold">Alamat Pengiriman</h2><p>{address.name} · {address.phone}</p><p className="text-muted-foreground">{address.street}, {address.district}, {address.city}, {address.province} {address.postalCode}</p>
    </section>
    <div className="mt-6 flex flex-wrap gap-3"><Button asChild><Link href={`/akun/pesanan/${order.orderNumber}`}>Lihat Detail Pesanan</Link></Button><Button asChild variant="outline"><Link href="/produk">Lanjut Belanja</Link></Button></div>
  </main>;
}
