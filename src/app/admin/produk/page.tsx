import Link from 'next/link';
import Image from 'next/image';
import { requireAdmin } from '@/lib/auth/akses';
import { daftarProdukAdmin, detailProdukAdmin, kategoriAdmin } from '@/lib/data/admin';
import { formatRupiah } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AdminHeading, AdminEmpty, AksiIkon, PaginationAdmin, safePage, safeQuery } from '@/components/admin/presentation';
import { AdminMutationButton, ProductAdminForm, type ProductFormData } from '@/components/admin/forms';
import { ModalAdmin } from '@/components/admin/ModalAdmin';
import { arsipkanProdukAdmin } from '@/actions/admin';
import { Pilihan } from '@/components/ui/pilihan';
import { Lencana } from '@/components/pesanan/Lencana';

type DetailProduk = NonNullable<Awaited<ReturnType<typeof detailProdukAdmin>>>;
function keFormProduk(product: DetailProduk): ProductFormData {
  const specs = product.specs && typeof product.specs === 'object' && !Array.isArray(product.specs) ? Object.fromEntries(Object.entries(product.specs).map(([key, value]) => [key, String(value)])) : {};
  return { id: product.id, version: product.updatedAt.toISOString(), name: product.name, slug: product.slug, description: product.description, brand: product.brand, categoryId: product.categoryId, price: product.price, compareAtPrice: product.compareAtPrice, weight: product.weight, stock: product.stock, variantLabel: product.variantLabel, isActive: product.isActive, isFeatured: product.isFeatured, isPreorder: product.isPreorder, tags: Array.isArray(product.tags) ? product.tags.map(String) : [], specs, images: product.images.map((i) => ({ url: i.url })), variants: product.variants.map((v) => ({ id: v.id, name: v.name, price: v.price, weight: v.weight, stock: v.stock, used: v._count.orderItems > 0 })) };
}

export default async function HalamanProdukAdmin({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin('/admin/produk');
  const params = await searchParams; const q = safeQuery(params.q); const active = safeQuery(params.active); const page = safePage(params.page);
  const idEdit = safeQuery(params.edit); const tambah = safeQuery(params.tambah) === '1';
  const bukaEdit = /^\d{1,9}$/.test(idEdit);
  const [data, categories, edit] = await Promise.all([daftarProdukAdmin(q, active, page), tambah || bukaEdit ? kategoriAdmin() : Promise.resolve([]), bukaEdit ? detailProdukAdmin(Number(idEdit)) : Promise.resolve(null)]);
  const sisa = new URLSearchParams(Object.entries({ q, active, page: page > 1 ? String(page) : '' }).filter(([, v]) => v));
  const daftarUrl = `/admin/produk${sisa.size ? `?${sisa}` : ''}`;
  const urlDengan = (kunci: string, nilai: string) => { const p = new URLSearchParams(sisa); p.set(kunci, nilai); return `/admin/produk?${p}`; };
  return <>
    <AdminHeading title="Produk" description="Kelola informasi, varian, gambar, harga, dan stok produk." action={<AksiIkon href={urlDengan('tambah', '1')} label="Tambah produk" jenis="tambah" />} />
    <form className="mb-6 flex flex-col items-end gap-3 sm:flex-row">
      <div className="w-full flex-1 space-y-1.5"><Label htmlFor="q">Cari produk</Label><Input id="q" name="q" defaultValue={q} placeholder="Nama produk" /></div>
      <div className="w-full space-y-1.5 sm:w-48"><Label htmlFor="active">Status</Label><Pilihan id="active" name="active" defaultValue={active} options={[{ value: '', label: 'Semua produk' }, { value: 'aktif', label: 'Aktif' }, { value: 'arsip', label: 'Diarsipkan' }]} /></div>
      <Button type="submit" variant="secondary" className="w-full sm:w-auto">Terapkan</Button>
    </form>
    {data.items.length ? <div className="overflow-hidden rounded-3xl border border-border"><Table><TableHeader><TableRow><TableHead>Produk</TableHead><TableHead>Harga</TableHead><TableHead>Stok</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Tindakan</TableHead></TableRow></TableHeader><TableBody>{data.items.map((p) => <TableRow key={p.id}>
      <TableCell><div className="flex min-w-48 items-center gap-3">{p.images[0] ? <Image src={p.images[0].url} alt={p.name} width={52} height={52} className="size-13 rounded-xl bg-tile object-cover" /> : <span aria-hidden className="size-13 rounded-xl bg-tile" />}<div><Link href={urlDengan('edit', String(p.id))} scroll={false} className="font-medium text-foreground underline-offset-4 hover:underline focus-visible:underline">{p.name}</Link><p className="text-xs text-muted-foreground">{p.category.name}</p></div></div></TableCell>
      <TableCell className="whitespace-nowrap tabular-nums">{formatRupiah(p.price)}</TableCell><TableCell className="tabular-nums">{p.stock}</TableCell>
      <TableCell><Lencana nada={p.isActive ? 'hijau' : 'netral'}>{p.isActive ? 'Aktif' : 'Diarsipkan'}</Lencana></TableCell>
      <TableCell><div className="flex flex-wrap items-center justify-end gap-2"><AksiIkon href={urlDengan('edit', String(p.id))} label="Edit" jenis="edit" />{p.isActive && <AdminMutationButton action={arsipkanProdukAdmin} data={{ id: p.id }} label="Arsipkan" confirmText={`Arsipkan ${p.name}? Produk akan berhenti tampil di katalog.`} />}</div></TableCell>
    </TableRow>)}</TableBody></Table></div> : <AdminEmpty>Belum ada produk yang cocok. Tambahkan produk atau ubah filter pencarian.</AdminEmpty>}
    <PaginationAdmin page={page} count={data.count} pathname="/admin/produk" query={{ q, active }} />
    {(tambah || edit) && <ModalAdmin key={edit?.id ?? 'baru'} judul={edit ? 'Edit produk' : 'Tambah produk'} deskripsi={edit ? edit.name : 'Isi informasi produk dan unggah gambar untuk mulai menjual.'} kembaliKe={daftarUrl} lebar="lebar">
      <ProductAdminForm key={edit?.id ?? 'new'} categories={categories.map(({ id, name, parentId }) => ({ id, name, parentId }))} product={edit ? keFormProduk(edit) : undefined} />
    </ModalAdmin>}
  </>;
}
