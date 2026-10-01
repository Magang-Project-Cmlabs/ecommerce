import Link from 'next/link';
import type { Metadata } from 'next';
import { ShoppingBag, Wallet, Clock, TrendingUp } from 'lucide-react';
import { requireAdmin } from '@/lib/auth/akses';
import { ringkasanAdmin } from '@/lib/data/admin';
import { formatRupiah, formatTanggalSingkat } from '@/lib/format';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AdminHeading, AdminEmpty, StatusBadge } from '@/components/admin/presentation';

export const metadata: Metadata = { title: 'Admin — TokoKita', robots: { index: false, follow: false } };

export default async function HalamanAdmin() {
  const admin = await requireAdmin('/admin');
  const data = await ringkasanAdmin();
  const stats = [{ label: 'Pesanan hari ini', value: String(data.pesananHariIni), icon: ShoppingBag }, { label: 'Omzet 7 hari', value: formatRupiah(data.omzet7), icon: Wallet }, { label: 'Omzet 30 hari', value: formatRupiah(data.omzet30), icon: TrendingUp }, { label: 'Perlu diproses', value: String(data.perluDiproses), icon: Clock }];
  return <><AdminHeading title="Ringkasan toko" description={`Selamat datang, ${admin.name}. Pantau aktivitas dan kelola toko Anda.`} /><div className="mb-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{stats.map(({ label, value, icon: Icon }) => <Card key={label}><CardContent className="space-y-3 pt-1"><div className="flex items-center justify-between text-muted-foreground"><span className="text-sm">{label}</span><Icon className="size-5" /></div><p className="break-words text-xl font-bold tabular-nums">{value}</p></CardContent></Card>)}</div>
    <Card className="mb-6"><CardHeader><CardTitle>Pesanan terbaru</CardTitle><Link href="/admin/pesanan" className="text-sm text-secondary underline">Lihat semua pesanan</Link></CardHeader><CardContent>{data.terbaru.length ? <Table><TableHeader><TableRow><TableHead>Pesanan</TableHead><TableHead>Pembeli</TableHead><TableHead>Total</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>{data.terbaru.map((order) => <TableRow key={order.id}><TableCell><Link className="font-medium text-secondary underline" href={`/admin/pesanan/${order.id}`}>{order.orderNumber}</Link><p className="text-xs text-muted-foreground">{formatTanggalSingkat(order.createdAt)}</p></TableCell><TableCell>{order.user.name}</TableCell><TableCell className="tabular-nums">{formatRupiah(order.grandTotal)}</TableCell><TableCell><StatusBadge status={order.status} /></TableCell></TableRow>)}</TableBody></Table> : <AdminEmpty>Belum ada pesanan.</AdminEmpty>}</CardContent></Card>
    <Card><CardHeader><CardTitle>Stok menipis</CardTitle><p className="text-sm text-muted-foreground">Produk atau varian dengan stok ≤ 5. Segera tambah stok agar pelanggan tetap bisa berbelanja.</p></CardHeader><CardContent>{data.stokMenipis.length ? <ul className="divide-y">{data.stokMenipis.map((p) => <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div><Link href={`/admin/produk/${p.id}`} className="font-medium text-secondary underline">{p.name}</Link>{p.variants.length > 0 && <p className="mt-1 text-xs text-muted-foreground">{p.variants.map((v) => `${v.name}: ${v.stock}`).join(' · ')}</p>}</div><span className="rounded-full bg-amber-50 px-3 py-1 text-sm font-medium text-amber-800">Stok total {p.stock}</span></li>)}</ul> : <AdminEmpty>Semua stok produk masih mencukupi.</AdminEmpty>}</CardContent></Card></>;
}
