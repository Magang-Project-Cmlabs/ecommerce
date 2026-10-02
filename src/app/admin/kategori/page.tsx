import { CornerDownRight } from 'lucide-react';
import { requireAdmin } from '@/lib/auth/akses';
import { kategoriAdmin } from '@/lib/data/admin';
import { hapusKategoriAdmin } from '@/actions/admin';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AdminHeading, AdminEmpty, AksiIkon, safeQuery } from '@/components/admin/presentation';
import { CategoryAdminForm, AdminMutationButton } from '@/components/admin/forms';
import { ModalAdmin } from '@/components/admin/ModalAdmin';
export default async function HalamanKategoriAdmin({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin('/admin/kategori');
  const params = await searchParams;
  const categories = await kategoriAdmin();
  const edit = Number(safeQuery(params.edit));
  const selected = categories.find((c) => c.id === edit);
  const tambah = safeQuery(params.tambah) === '1';
  // Induk diikuti anak-anaknya, masing-masing menurut urutan tampilan lalu nama.
  const posisi = (k: (typeof categories)[number]) => String(k.sortOrder).padStart(4, '0') + k.name;
  const kunci = (k: (typeof categories)[number]) => { const induk = categories.find((x) => x.id === k.parentId); return induk ? posisi(induk) + ' / ' + posisi(k) : posisi(k); };
  const urut = [...categories].sort((a, b) => kunci(a).localeCompare(kunci(b), 'id'));
  return <>
    <AdminHeading title="Kategori" description="Atur kategori utama, subkategori, gambar, dan urutan tampilan." action={<AksiIkon href="/admin/kategori?tambah=1" label="Tambah kategori" jenis="tambah" />} />
    {categories.length ? <div className="overflow-hidden rounded-3xl border border-border"><Table><TableHeader><TableRow><TableHead>Kategori</TableHead><TableHead>Urutan</TableHead><TableHead>Produk</TableHead><TableHead className="text-right">Tindakan</TableHead></TableRow></TableHeader><TableBody>{urut.map((c) => <TableRow key={c.id}>
      <TableCell>{c.parentId ? <div className="flex items-start gap-2 pl-4"><CornerDownRight aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground" /><div><p className="font-medium">{c.name}</p><p className="text-xs text-muted-foreground">/{c.slug}</p></div></div> : <><p className="font-medium">{c.name}</p><p className="text-xs text-muted-foreground">Kategori utama · /{c.slug}</p></>}</TableCell>
      <TableCell className="tabular-nums">{c.sortOrder}</TableCell><TableCell className="tabular-nums">{c._count.products}</TableCell>
      <TableCell><div className="flex flex-wrap justify-end gap-2"><AksiIkon href={`/admin/kategori?edit=${c.id}`} label="Edit" jenis="edit" />{c._count.products === 0 && c._count.children === 0 && <AdminMutationButton action={hapusKategoriAdmin} data={{ id: c.id }} label="Hapus" confirmText={`Hapus kategori ${c.name}?`} />}</div></TableCell>
    </TableRow>)}</TableBody></Table></div> : <AdminEmpty>Belum ada kategori. Tambahkan kategori pertama.</AdminEmpty>}
    <p className="mt-4 text-sm text-muted-foreground">Kategori yang masih berisi produk atau subkategori tidak bisa dihapus.</p>
    {(tambah || selected) && <ModalAdmin key={selected?.id ?? 'baru'} judul={selected ? 'Edit kategori' : 'Tambah kategori'} deskripsi={selected ? selected.name : 'Kategori baru langsung tampil di toko.'} kembaliKe="/admin/kategori">
      <CategoryAdminForm key={selected?.id ?? 'new'} category={selected} categories={categories.map(({ id, name, parentId }) => ({ id, name, parentId }))} />
    </ModalAdmin>}
  </>;
}
