import { CornerDownRight } from 'lucide-react';
import { requireAdmin } from '@/lib/auth/akses';
import { kategoriAdmin } from '@/lib/data/admin';
import { hapusKategoriAdmin } from '@/actions/admin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AdminHeading, AdminEmpty, AksiIkon, safeQuery } from '@/components/admin/presentation';
import { CategoryAdminForm, AdminMutationButton } from '@/components/admin/forms';
export default async function HalamanKategoriAdmin({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin('/admin/kategori');
  const categories = await kategoriAdmin();
  const edit = Number(safeQuery((await searchParams).edit));
  const selected = categories.find((c) => c.id === edit);
  // Induk diikuti anak-anaknya, masing-masing menurut urutan tampilan lalu nama.
  const posisi = (k: (typeof categories)[number]) => String(k.sortOrder).padStart(4, '0') + k.name;
  const kunci = (k: (typeof categories)[number]) => { const induk = categories.find((x) => x.id === k.parentId); return induk ? posisi(induk) + ' / ' + posisi(k) : posisi(k); };
  const urut = [...categories].sort((a, b) => kunci(a).localeCompare(kunci(b), 'id'));
  return <><AdminHeading title="Kategori" description="Atur kategori utama, subkategori, gambar, dan urutan tampilan." /><div className="grid gap-6 xl:grid-cols-[1fr_340px]"><div>{categories.length ? <div className="rounded-xl border bg-background"><Table><TableHeader><TableRow><TableHead>Kategori</TableHead><TableHead>Urutan</TableHead><TableHead>Produk</TableHead><TableHead>Tindakan</TableHead></TableRow></TableHeader><TableBody>{urut.map((c) => <TableRow key={c.id}><TableCell>{c.parentId ? <div className="flex items-start gap-2 pl-4"><CornerDownRight aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground" /><div><p className="font-medium">{c.name}</p><p className="text-xs text-muted-foreground">/{c.slug}</p></div></div> : <><p className="font-semibold">{c.name}</p><p className="text-xs text-muted-foreground">Kategori utama · /{c.slug}</p></>}</TableCell><TableCell>{c.sortOrder}</TableCell><TableCell>{c._count.products}</TableCell><TableCell><div className="flex flex-wrap gap-2"><AksiIkon href={`/admin/kategori?edit=${c.id}`} label="Edit" jenis="edit" />{c._count.products === 0 && c._count.children === 0 && <AdminMutationButton action={hapusKategoriAdmin} data={{ id: c.id }} label="Hapus" confirmText={`Hapus kategori ${c.name}?`} />}</div></TableCell></TableRow>)}</TableBody></Table></div> : <AdminEmpty>Belum ada kategori. Tambahkan kategori pertama.</AdminEmpty>}<p className="mt-4 text-xs text-muted-foreground">Kategori yang masih berisi produk atau subkategori tidak bisa dihapus.</p></div><Card><CardHeader><CardTitle>{selected ? 'Edit kategori' : 'Tambah kategori'}</CardTitle>{selected && <AksiIkon href="/admin/kategori" label="Tambah kategori baru" jenis="tambah" />}</CardHeader><CardContent><CategoryAdminForm key={selected?.id ?? 'new'} category={selected} categories={categories.map(({ id, name, parentId }) => ({ id, name, parentId }))} /></CardContent></Card></div></>;
}
