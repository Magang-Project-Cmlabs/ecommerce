import Link from 'next/link';
import { requireAdmin } from '@/lib/auth/akses';
import { daftarPesananAdmin } from '@/lib/data/admin';
import { LABEL_STATUS_PESANAN, LABEL_STATUS_PEMBAYARAN, type OrderStatus } from '@/lib/pesanan/status';
import { formatRupiah, formatTanggalSingkat } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AdminHeading, AdminEmpty, AksiIkon, StatusBadge, PaginationAdmin, safePage, safeQuery } from '@/components/admin/presentation';
import { Pilihan } from '@/components/ui/pilihan';
export default async function HalamanPesananAdmin({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin('/admin/pesanan');
  const params = await searchParams; const q = safeQuery(params.q); const status = safeQuery(params.status); const page = safePage(params.page);
  const selectedStatus = Object.hasOwn(LABEL_STATUS_PESANAN, status) ? status as OrderStatus : undefined;
  const data = await daftarPesananAdmin(selectedStatus, q, page);
  return <><AdminHeading title="Pesanan" description="Proses pesanan, verifikasi pembayaran, dan pantau pengiriman." /><form className="mb-6 flex flex-col items-end gap-3 sm:flex-row"><div className="w-full flex-1 space-y-1.5"><Label htmlFor="q">Cari pesanan</Label><Input id="q" name="q" defaultValue={q} placeholder="Nomor pesanan atau nama pembeli" /></div><div className="w-full space-y-1 sm:w-52"><Label htmlFor="status">Status pesanan</Label><Pilihan id="status" name="status" defaultValue={selectedStatus ?? ''} options={[{ value: '', label: 'Semua status' }, ...Object.entries(LABEL_STATUS_PESANAN).map(([value, label]) => ({ value, label }))]} /></div><Button type="submit" variant="secondary" className="w-full sm:w-auto">Terapkan</Button></form>{data.items.length ? <div className="overflow-hidden rounded-3xl border border-border"><Table><TableHeader><TableRow><TableHead>Pesanan</TableHead><TableHead>Pembeli</TableHead><TableHead>Total</TableHead><TableHead>Pembayaran</TableHead><TableHead>Status</TableHead><TableHead className="text-right"><span className="sr-only">Tindakan</span></TableHead></TableRow></TableHeader><TableBody>{data.items.map((order) => <TableRow key={order.id}><TableCell><Link href={`/admin/pesanan/${order.id}`} className="whitespace-nowrap font-medium text-foreground underline-offset-4 hover:underline focus-visible:underline">{order.orderNumber}</Link><p className="text-xs text-muted-foreground">{formatTanggalSingkat(order.createdAt)}</p></TableCell><TableCell>{order.user.name}</TableCell><TableCell className="whitespace-nowrap tabular-nums">{formatRupiah(order.grandTotal)}</TableCell><TableCell>{LABEL_STATUS_PEMBAYARAN[order.paymentStatus]}</TableCell><TableCell><StatusBadge status={order.status} /></TableCell><TableCell className="text-right"><AksiIkon href={`/admin/pesanan/${order.id}`} label={`Lihat detail ${order.orderNumber}`} teks="Detail" jenis="detail" /></TableCell></TableRow>)}</TableBody></Table></div> : <AdminEmpty>Belum ada pesanan yang cocok dengan filter ini.</AdminEmpty>}<PaginationAdmin page={page} count={data.count} pathname="/admin/pesanan" query={{ q, status }} /></>;
}
