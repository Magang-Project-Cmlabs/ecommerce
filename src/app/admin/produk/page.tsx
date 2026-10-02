import Link from 'next/link';
import Image from 'next/image';
import { requireAdmin } from '@/lib/auth/akses';
import { daftarProdukAdmin } from '@/lib/data/admin';
import { formatRupiah } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus } from 'lucide-react';
import { AdminHeading, AdminEmpty, AksiIkon, PaginationAdmin, safePage, safeQuery } from '@/components/admin/presentation';
import { AdminMutationButton } from '@/components/admin/forms';
import { arsipkanProdukAdmin } from '@/actions/admin';
export default async function HalamanProdukAdmin({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin('/admin/produk');
  const params = await searchParams; const q = safeQuery(params.q); const active = safeQuery(params.active); const page = safePage(params.page);
  const data = await daftarProdukAdmin(q, active, page);
  return <><AdminHeading title="Produk" description="Kelola informasi, varian, gambar, harga, dan stok produk." action={<Button asChild><Link href="/admin/produk/baru"><Plus aria-hidden />Tambah produk</Link></Button>} /><form className="mb-6 flex flex-col items-end gap-3 sm:flex-row"><div className="w-full flex-1 space-y-1"><Label htmlFor="q">Cari produk</Label><Input id="q" name="q" defaultValue={q} placeholder="Nama produk" className="min-h-10" /></div><div className="w-full space-y-1 sm:w-44"><Label htmlFor="active">Status</Label><select name="active" id="active" defaultValue={active} className="min-h-10 w-full rounded-lg border bg-background px-3 text-sm"><option value="">Semua produk</option><option value="aktif">Aktif</option><option value="arsip">Diarsipkan</option></select></div><Button className="min-h-10" type="submit">Terapkan</Button></form>{data.items.length ? <div className="rounded-xl border bg-background"><Table><TableHeader><TableRow><TableHead>Produk</TableHead><TableHead>Harga</TableHead><TableHead>Stok</TableHead><TableHead>Status</TableHead><TableHead>Tindakan</TableHead></TableRow></TableHeader><TableBody>{data.items.map((p) => <TableRow key={p.id}><TableCell><div className="flex min-w-44 items-center gap-3">{p.images[0] && <Image src={p.images[0].url} alt={p.name} width={48} height={48} className="rounded-lg object-cover" />}<div><Link href={`/admin/produk/${p.id}`} className="font-medium text-foreground underline-offset-4 hover:text-primary hover:underline focus-visible:underline">{p.name}</Link><p className="text-xs text-muted-foreground">{p.category.name}</p></div></div></TableCell><TableCell className="whitespace-nowrap tabular-nums">{formatRupiah(p.price)}</TableCell><TableCell>{p.stock}</TableCell><TableCell>{p.isActive ? 'Aktif' : 'Diarsipkan'}</TableCell><TableCell><div className="flex flex-wrap items-center gap-2"><AksiIkon href={`/admin/produk/${p.id}`} label="Edit" jenis="edit" />{p.isActive && <AdminMutationButton action={arsipkanProdukAdmin} data={{ id: p.id }} label="Arsipkan" confirmText={`Arsipkan ${p.name}? Produk akan berhenti tampil di katalog.`} />}</div></TableCell></TableRow>)}</TableBody></Table></div> : <AdminEmpty>Belum ada produk yang cocok. Tambahkan produk atau ubah filter pencarian.</AdminEmpty>}<PaginationAdmin page={page} count={data.count} pathname="/admin/produk" query={{ q, active }} /></>;
}
