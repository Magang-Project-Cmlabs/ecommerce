import Link from 'next/link';
import { requireAdmin } from '@/lib/auth/akses';
import { kategoriAdmin } from '@/lib/data/admin';
import { hapusKategoriAdmin } from '@/actions/admin';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AdminHeading, AdminEmpty, safeQuery } from '@/components/admin/presentation';
import { CategoryAdminForm, AdminMutationButton } from '@/components/admin/forms';
export default async function HalamanKategoriAdmin({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin('/admin/kategori');
  const categories = await kategoriAdmin();
  const edit = Number(safeQuery((await searchParams).edit));
  const selected = categories.find((c) => c.id === edit);
  function hierarchy(id: number): string {
    const names: string[] = []; const visited = new Set<number>(); let current = categories.find((c) => c.id === id);
    while (current && !visited.has(current.id)) { visited.add(current.id); names.unshift(current.name); current = categories.find((c) => c.id === current!.parentId); }
    return names.join(' / ');
  }
  return <><AdminHeading title="Kategori" description="Atur kategori utama, subkategori, gambar, dan urutan tampilan." /><div className="grid gap-6 xl:grid-cols-[1fr_340px]"><div>{categories.length ? <div className="rounded-xl border bg-background"><Table><TableHeader><TableRow><TableHead>Kategori</TableHead><TableHead>Urutan</TableHead><TableHead>Produk</TableHead><TableHead>Tindakan</TableHead></TableRow></TableHeader><TableBody>{categories.map((c) => <TableRow key={c.id}><TableCell><p className="font-medium">{hierarchy(c.id)}</p><p className="text-xs text-muted-foreground">/{c.slug}</p></TableCell><TableCell>{c.sortOrder}</TableCell><TableCell>{c._count.products}</TableCell><TableCell><div className="flex flex-wrap gap-2"><Button asChild variant="outline" className="min-h-10"><Link href={`/admin/kategori?edit=${c.id}`}>Edit</Link></Button>{c._count.products === 0 && c._count.children === 0 && <AdminMutationButton action={hapusKategoriAdmin} data={{ id: c.id }} label="Hapus" confirmText={`Hapus kategori ${c.name}?`} />}</div></TableCell></TableRow>)}</TableBody></Table></div> : <AdminEmpty>Belum ada kategori. Tambahkan kategori pertama.</AdminEmpty>}<p className="mt-4 text-xs text-muted-foreground">Kategori yang masih berisi produk atau subkategori tidak bisa dihapus.</p></div><Card><CardHeader><CardTitle>{selected ? 'Edit kategori' : 'Tambah kategori'}</CardTitle>{selected && <Link href="/admin/kategori" className="text-sm text-secondary underline">Tambah kategori baru</Link>}</CardHeader><CardContent><CategoryAdminForm key={selected?.id ?? 'new'} category={selected} categories={categories.map(({ id, name, parentId }) => ({ id, name, parentId }))} /></CardContent></Card></div></>;
}
