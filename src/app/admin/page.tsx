import Link from 'next/link';
import type { Metadata } from 'next';
import { ShoppingBag, Wallet, Clock, TrendingUp, ChevronRight, PackageCheck } from 'lucide-react';
import { requireAdmin } from '@/lib/auth/akses';
import { ringkasanAdmin } from '@/lib/data/admin';
import { formatRupiah, formatTanggalSingkat } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AdminHeading, AdminEmpty, StatusBadge, StokBadge } from '@/components/admin/presentation';

export const metadata: Metadata = { title: 'Admin', robots: { index: false, follow: false } };

const tautanBaris = 'font-medium text-foreground underline-offset-4 hover:text-primary hover:underline focus-visible:underline';

export default async function HalamanAdmin() {
  const admin = await requireAdmin('/admin');
  const data = await ringkasanAdmin();
  const stats = [
    { label: 'Pesanan hari ini', value: String(data.pesananHariIni), icon: ShoppingBag, href: '/admin/pesanan', sorot: false },
    { label: 'Omzet 7 hari', value: formatRupiah(data.omzet7), icon: Wallet, href: null, sorot: false },
    { label: 'Omzet 30 hari', value: formatRupiah(data.omzet30), icon: TrendingUp, href: null, sorot: false },
    { label: 'Perlu diproses', value: String(data.perluDiproses), icon: Clock, href: '/admin/pesanan', sorot: data.perluDiproses > 0 },
  ];
  // Satu baris per produk: angka yang menentukan urgensi adalah stok terendah (varian atau produk).
  const stok = data.stokMenipis
    .map((p) => ({ ...p, sisa: p.variants.length ? Math.min(...p.variants.map((v) => v.stock)) : p.stock }))
    .sort((a, b) => a.sisa - b.sisa);
  const tampil = stok.slice(0, 6);
  return <>
    <AdminHeading title="Ringkasan toko" description={`Selamat datang, ${admin.name}. Pantau aktivitas dan kelola toko Anda.`} />
    <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
      {stats.map(({ label, value, icon: Icon, href, sorot }) => {
        const isi = <Card className={`h-full transition-colors ${sorot ? 'border-amber-300 bg-amber-50/70 dark:bg-amber-500/10' : ''} ${href ? 'group-hover:ring-foreground/20' : ''}`}><CardContent className="space-y-3 pt-1">
          <div className="flex items-start justify-between gap-2"><span className="text-xs text-muted-foreground sm:text-sm">{label}</span><span className={`flex size-9 items-center justify-center rounded-lg ${sorot ? 'bg-amber-100 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300' : 'bg-muted text-foreground/80'}`}><Icon aria-hidden className="size-[18px]" /></span></div>
          <p className={`break-words text-lg font-bold tabular-nums sm:text-2xl ${sorot ? 'text-amber-900 dark:text-amber-300' : ''}`}>{value}</p>
        </CardContent></Card>;
        return href ? <Link key={label} href={href} className="group rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{isi}</Link> : <div key={label}>{isi}</div>;
      })}
    </div>
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <Card className="min-w-0">
        <CardHeader className="flex flex-row items-center justify-between gap-3"><CardTitle>Pesanan terbaru</CardTitle><Button asChild variant="outline" size="sm"><Link href="/admin/pesanan">Lihat semua<ChevronRight aria-hidden /></Link></Button></CardHeader>
        <CardContent>{data.terbaru.length ? <Table><TableHeader><TableRow><TableHead>Pesanan</TableHead><TableHead className="hidden sm:table-cell">Pembeli</TableHead><TableHead className="text-right">Total</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>{data.terbaru.map((order) => <TableRow key={order.id}><TableCell><Link className={tautanBaris} href={`/admin/pesanan/${order.id}`}>{order.orderNumber}</Link><p className="text-xs text-muted-foreground">{formatTanggalSingkat(order.createdAt)}</p></TableCell><TableCell className="hidden sm:table-cell">{order.user.name}</TableCell><TableCell className="text-right tabular-nums">{formatRupiah(order.grandTotal)}</TableCell><TableCell><StatusBadge status={order.status} /></TableCell></TableRow>)}</TableBody></Table> : <AdminEmpty>Belum ada pesanan.</AdminEmpty>}</CardContent>
      </Card>
      <Card className="min-w-0 self-start">
        <CardHeader><CardTitle>Stok menipis</CardTitle><p className="text-sm text-muted-foreground">Produk atau varian dengan stok ≤ 5.</p></CardHeader>
        <CardContent>{tampil.length ? <>
          <ul className="divide-y">{tampil.map((p) => <li key={p.id} className="flex items-center justify-between gap-3 py-3">
            <div className="min-w-0"><Link href={`/admin/produk/${p.id}`} className={`block truncate ${tautanBaris}`}>{p.name}</Link>{p.variants.length > 0 && <p className="mt-0.5 truncate text-xs text-muted-foreground">{p.variants.map((v) => `${v.name}: ${v.stock}`).join(' · ')}</p>}</div>
            <StokBadge stok={p.sisa} />
          </li>)}</ul>
          {stok.length > tampil.length && <Button asChild variant="ghost" size="sm" className="mt-2 w-full"><Link href="/admin/produk">Lihat {stok.length - tampil.length} produk lainnya</Link></Button>}
        </> : <div className="flex flex-col items-center gap-2 py-6 text-center text-sm text-muted-foreground"><PackageCheck aria-hidden className="size-8 text-green-600" />Semua stok produk masih mencukupi.</div>}</CardContent>
      </Card>
    </div>
  </>;
}
