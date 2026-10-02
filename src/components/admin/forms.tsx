'use client';

import { useActionState, useEffect, useRef, useState, useId, type ReactNode } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Archive, ImagePlus, LoaderCircle, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { simpanProdukAdmin, simpanKategoriAdmin, simpanPromoAdmin, simpanBannerAdmin, ubahStatusAdmin } from '@/actions/admin';
import type { AdminActionState } from '@/lib/validations/admin';
import type { OrderStatus } from '@/lib/pesanan/status';
import { unggahGambar } from '@/actions/upload';
import type { TujuanUpload } from '@/lib/validations/upload';

type Action = (prev: AdminActionState, data: FormData) => Promise<AdminActionState>;
const initial: AdminActionState = {};
const control = 'flex min-h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50';

function useAdminForm(action: Action, purpose?: TujuanUpload) {
  const [progress, setProgress] = useState('');
  const [state, formAction, pending] = useActionState(async (previous: AdminActionState, data: FormData): Promise<AdminActionState> => {
    if (!purpose) return action(previous, data);
    const images = data.getAll('images').filter((file): file is File => file instanceof File && file.size > 0);
    const maximum = purpose === 'product' ? 8 : 1;
    let retained = 0;
    try { retained = purpose === 'product' ? (JSON.parse(String(data.get('retainedImages') ?? '[]')) as string[]).length : 0; } catch { /* Final action validates retained images. */ }
    if (images.length + retained > maximum) return { message: `Maksimal ${maximum} gambar.`, errors: { images: [`Maksimal ${maximum} gambar.`] } };
    if (images.some((file) => file.size > 2 * 1024 * 1024 || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type))) return { message: 'Gunakan gambar JPG, PNG, WebP dengan ukuran maksimal 2 MB per gambar.', errors: { images: ['Gambar maksimal 2 MB, format JPG/PNG/WebP.'] } };
    const tokens: string[] = [];
    try {
      for (const [index, file] of images.entries()) {
        setProgress(`Mengunggah gambar ${index + 1} dari ${images.length}…`);
        const upload = new FormData(); upload.set('purpose', purpose); upload.set('file', file);
        const result = await unggahGambar(upload);
        if (!result.ok) return { message: result.message, errors: { images: [result.message] } };
        tokens.push(result.token);
      }
      data.delete('images'); data.set('uploadTokens', JSON.stringify(tokens));
      setProgress('Menyimpan data…');
      return await action(previous, data);
    } catch { return { message: 'Unggahan atau penyimpanan belum berhasil. Silakan coba lagi.' }; }
    finally { setProgress(''); }
  }, initial);
  useEffect(() => { if (state.success && state.message) toast.success(state.message); }, [state]);
  return { state, formAction, pending, progress };
}
function Feedback({ state }: { state: AdminActionState }) {
  return state.message ? <p role={state.success ? 'status' : 'alert'} className={`rounded-xl border p-3 text-sm ${state.success ? 'border-green-200 bg-green-50 text-green-700' : 'border-destructive/30 bg-destructive/5 text-destructive'}`}>{state.message}</p> : null;
}
function Field({ name, label, state, children }: { name: string; label: string; state: AdminActionState; children: ReactNode }) {
  return <div className="min-w-0 space-y-1.5"><Label htmlFor={name}>{label}</Label>{children}{state.errors?.[name]?.map((message) => <p id={`${name}-error`} key={message} className="text-sm text-destructive">{message}</p>)}</div>;
}
function TextField({ name, label, state, value, type = 'text', required, maxLength, readOnly }: { name: string; label: string; state: AdminActionState; value?: string | number | null; type?: string; required?: boolean; maxLength?: number; readOnly?: boolean }) {
  return <Field name={name} label={label} state={state}><Input id={name} name={name} type={type} defaultValue={value ?? ''} required={required} maxLength={maxLength} readOnly={readOnly} min={type === 'number' ? 0 : undefined} step={type === 'number' ? 1 : undefined} className="min-h-10" aria-invalid={!!state.errors?.[name]} aria-describedby={state.errors?.[name] ? `${name}-error` : undefined} /></Field>;
}
function CheckField({ name, label, value }: { name: string; label: string; value?: boolean }) {
  return <label className="flex min-h-11 items-center gap-2 text-sm"><input className="size-4 accent-orange-600" name={name} type="checkbox" defaultChecked={value} />{label}</label>;
}
/** Pengganti input file bawaan browser (berbahasa Inggris); input asli tetap dipakai form dan label. */
function PilihGambar({ multiple, required }: { multiple?: boolean; required?: boolean }) {
  const ref = useRef<HTMLInputElement>(null);
  const [pilihan, setPilihan] = useState('');
  return <div className="flex flex-wrap items-center gap-3 rounded-lg border border-dashed border-input bg-muted/30 p-3">
    <input ref={ref} id="images" name="images" type="file" accept="image/jpeg,image/png,image/webp" multiple={multiple} required={required} tabIndex={-1} className="sr-only"
      onChange={(e) => { const files = Array.from(e.target.files ?? []); setPilihan(files.length === 0 ? '' : files.length === 1 ? files[0]!.name : `${files.length} gambar dipilih`); }} />
    <Button type="button" variant="outline" className="min-h-10" onClick={() => ref.current?.click()} aria-describedby="images-pilihan"><ImagePlus aria-hidden />Pilih gambar</Button>
    <span id="images-pilihan" className="min-w-0 truncate text-sm text-muted-foreground">{pilihan || 'Belum ada gambar dipilih'}</span>
  </div>;
}
function SaveButton({ pending, children = 'Simpan perubahan' }: { pending: boolean; children?: ReactNode }) {
  return <Button className="min-h-11 px-5" disabled={pending} type="submit">{pending && <LoaderCircle className="size-4 animate-spin" />}{pending ? 'Menyimpan…' : children}</Button>;
}

export function AdminMutationButton({ action, data, label, confirmText }: { action: Action; data: Record<string, string | number>; label: string; confirmText?: string }) {
  const { state, formAction, pending } = useAdminForm(action);
  const formId = useId();
  return <form id={formId} action={formAction} className="space-y-2">{Object.entries(data).map(([name, value]) => <input key={name} type="hidden" name={name} value={value} />)}{confirmText ? <ConfirmButton formId={formId} label={label} description={confirmText} pending={pending} /> : <Button type="submit" variant="destructive" size="icon-sm" aria-label={label} title={label} className="pointer-coarse:size-11" disabled={pending}>{pending ? <LoaderCircle className="animate-spin" /> : <Trash2 aria-hidden />}</Button>}<Feedback state={state} /></form>;
}
function ConfirmButton({ formId, label, description, pending }: { formId: string; label: string; description: string; pending: boolean }) {
  return <AlertDialog><AlertDialogTrigger asChild><Button type="button" variant="destructive" size="icon-sm" aria-label={label} title={label} className="pointer-coarse:size-11" disabled={pending}>{pending ? <LoaderCircle className="animate-spin" /> : label === 'Arsipkan' ? <Archive aria-hidden /> : <Trash2 aria-hidden />}</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Konfirmasi tindakan</AlertDialogTitle><AlertDialogDescription>{description}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel className="min-h-11">Kembali</AlertDialogCancel><AlertDialogAction type="submit" form={formId} className="min-h-11" variant="destructive">Lanjutkan</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>;
}

type CategoryOption = { id: number; name: string; parentId: number | null };
type Variant = { id: number | null; name: string; price: number | null; weight: number | null; stock: number; used?: boolean };
export type ProductFormData = {
  id: number; version: string; name: string; slug: string; description: string; brand: string; categoryId: number; price: number;
  compareAtPrice: number | null; weight: number; stock: number; variantLabel: string | null; isActive: boolean; isFeatured: boolean; isPreorder: boolean;
  tags: string[]; specs: Record<string, string>; images: { url: string }[]; variants: Variant[];
};
export function ProductAdminForm({ product, categories }: { product?: ProductFormData; categories: CategoryOption[] }) {
  const { state, formAction, pending, progress } = useAdminForm(simpanProdukAdmin, 'product');
  const router = useRouter();
  const [variants, setVariants] = useState<Variant[]>(product?.variants ?? []);
  const [images, setImages] = useState(product?.images.map((i) => i.url) ?? []);
  useEffect(() => { if (state.success && state.id && !product) router.replace(`/admin/produk/${state.id}`); }, [state, router, product]);
  const changeVariant = (index: number, name: keyof Variant, value: string) => setVariants((previous) => previous.map((v, i) => i === index ? { ...v, [name]: name === 'name' ? value : value === '' ? null : Number(value) } : v));
  return <form action={formAction} className="space-y-6"><input type="hidden" name="id" value={product?.id ?? ''} /><input type="hidden" name="version" value={product?.version ?? ''} /><input type="hidden" name="variants" value={JSON.stringify(variants)} /><input type="hidden" name="retainedImages" value={JSON.stringify(images)} /><Feedback state={state} />
    <Card><CardHeader><CardTitle>Informasi produk</CardTitle></CardHeader><CardContent className="grid gap-5 md:grid-cols-2">
      <TextField name="name" label="Nama produk" value={product?.name} required maxLength={200} state={state} /><TextField name="slug" label="Slug URL (contoh: kaos-katun)" value={product?.slug} required state={state} />
      <TextField name="brand" label="Merek" value={product?.brand} required maxLength={100} state={state} /><Field name="categoryId" label="Kategori" state={state}><select className={control} id="categoryId" name="categoryId" defaultValue={product?.categoryId ?? ''} required><option value="">Pilih kategori</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.parentId ? `${categories.find((p) => p.id === c.parentId)?.name ?? ''} / ` : ''}{c.name}</option>)}</select></Field>
      <div className="md:col-span-2"><Field name="description" label="Deskripsi" state={state}><textarea id="description" name="description" defaultValue={product?.description} className={control} rows={5} required maxLength={20000} /></Field></div>
      <TextField name="tags" label="Tag (pisahkan dengan koma)" value={product?.tags.join(', ')} state={state} /><Field name="specs" label="Spesifikasi (Nama: Nilai per baris)" state={state}><textarea id="specs" name="specsText" className={control} rows={4} defaultValue={Object.entries(product?.specs ?? {}).map(([k, v]) => `${k}: ${v}`).join('\n')} placeholder={'Bahan: Katun\nUkuran: 30 × 40 cm'} /></Field>
    </CardContent></Card>
    <Card><CardHeader><CardTitle>Harga, stok, dan berat</CardTitle></CardHeader><CardContent className="grid gap-5 md:grid-cols-2"><TextField name="price" label="Harga jual (Rp)" value={product?.price} type="number" required state={state} /><TextField name="compareAtPrice" label="Harga sebelum diskon (Rp, opsional)" value={product?.compareAtPrice} type="number" state={state} /><TextField name="weight" label="Berat (gram)" value={product?.weight} type="number" required state={state} /><TextField name="stock" label={variants.length ? 'Stok produk (otomatis total varian)' : 'Stok produk'} value={product?.stock ?? 0} type="number" required readOnly={!!variants.length} state={state} /><div className="flex flex-wrap gap-x-6 md:col-span-2"><CheckField name="isActive" label="Aktif di katalog" value={product?.isActive ?? true} /><CheckField name="isFeatured" label="Produk unggulan" value={product?.isFeatured} /><CheckField name="isPreorder" label="Pre-order" value={product?.isPreorder} /></div></CardContent></Card>
    <Card><CardHeader><CardTitle>Varian produk</CardTitle></CardHeader><CardContent className="space-y-4"><TextField name="variantLabel" label="Label varian (contoh: Ukuran)" value={product?.variantLabel} state={state} />{state.errors?.variants && <p className="text-destructive text-sm">{state.errors.variants.join(' ')}</p>}<p className="text-sm text-muted-foreground">Harga dan berat kosong mengikuti produk. Varian yang pernah dipesan tetap disimpan; gunakan stok 0 untuk menghentikan penjualan.</p>{variants.map((v, i) => <fieldset key={v.id ?? `new-${i}`} className="grid gap-3 rounded-xl border p-4 sm:grid-cols-2 lg:grid-cols-5"><legend className="px-1 text-sm font-medium">Varian {i + 1}</legend>{(['name', 'price', 'weight', 'stock'] as const).map((name) => <div key={name} className="space-y-1"><Label htmlFor={`v${i}-${name}`}>{({ name: 'Nama', price: 'Harga (Rp)', weight: 'Berat (gram)', stock: 'Stok' })[name]}</Label><Input id={`v${i}-${name}`} type={name === 'name' ? 'text' : 'number'} min={0} step={1} value={v[name] ?? ''} required={name === 'name' || name === 'stock'} onChange={(e) => changeVariant(i, name, e.target.value)} /></div>)}<Button type="button" variant="destructive" size="icon-sm" aria-label={`Hapus varian ${i + 1}`} title="Hapus varian" className="self-end pointer-coarse:size-11" disabled={v.used || pending} onClick={() => setVariants((list) => list.filter((_, index) => index !== i))}><Trash2 aria-hidden /></Button></fieldset>)}<Button type="button" variant="outline" className="min-h-11" disabled={pending || variants.length >= 30} onClick={() => setVariants((v) => [...v, { id: null, name: '', price: null, weight: null, stock: 0 }])}><Plus />Tambah varian</Button></CardContent></Card>
    <Card><CardHeader><CardTitle>Gambar produk</CardTitle></CardHeader><CardContent className="space-y-4"><p className="text-sm text-muted-foreground">JPG, PNG, WebP · maksimal 2 MB per gambar · minimal 800 × 800 px · maksimal 8 gambar. Gambar pertama menjadi sampul. Gambar baru ditambahkan setelah gambar yang dipertahankan.</p><div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{images.map((url, i) => <div key={url} className="space-y-2 rounded-lg border p-2"><Image src={url} alt={`${product?.name ?? 'Produk'} gambar ${i + 1}`} width={160} height={160} className="aspect-square w-full rounded object-cover" /><div className="flex gap-1"><Button variant="outline" className="min-h-10 flex-1" type="button" disabled={i === 0} onClick={() => setImages((list) => { const next = [...list]; [next[i - 1], next[i]] = [next[i]!, next[i - 1]!]; return next; })}>Utamakan</Button><Button type="button" variant="destructive" className="min-h-10" aria-label={`Hapus gambar ${i + 1}`} onClick={() => setImages((list) => list.filter((_, n) => n !== i))}><Trash2 /></Button></div></div>)}</div><Field name="images" label="Unggah gambar" state={state}><PilihGambar multiple /></Field></CardContent></Card>
    {progress && <p role="status" className="text-sm text-muted-foreground">{progress}</p>}<SaveButton pending={pending}>{product ? 'Simpan perubahan' : 'Simpan produk'}</SaveButton></form>;
}

type CategoryData = CategoryOption & { slug: string; sortOrder: number; image: string | null };
export function CategoryAdminForm({ category, categories }: { category?: CategoryData; categories: CategoryOption[] }) {
  const { state, formAction, pending } = useAdminForm(simpanKategoriAdmin, 'category');
  return <form action={formAction} className="space-y-4"><input name="id" type="hidden" value={category?.id ?? ''} /><Feedback state={state} /><TextField name="name" label="Nama kategori" value={category?.name} required state={state} /><TextField name="slug" label="Slug URL" value={category?.slug} required state={state} /><Field name="parentId" label="Kategori induk" state={state}><select className={control} id="parentId" name="parentId" defaultValue={category?.parentId ?? ''}><option value="">Kategori utama</option>{categories.filter((c) => c.id !== category?.id).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field><TextField name="sortOrder" label="Urutan tampilan" value={category?.sortOrder ?? 0} type="number" required state={state} />{category?.image && <Image src={category.image} alt={category.name} width={120} height={120} className="rounded-lg object-cover" />}<Field name="images" label="Gambar kategori (opsional, JPG/PNG/WebP, ≤ 2 MB)" state={state}><PilihGambar /></Field><SaveButton pending={pending}>{category ? 'Simpan perubahan' : 'Tambah kategori'}</SaveButton></form>;
}

export type PromoFormData = { code: string; description: string; type: 'PERCENT' | 'FIXED'; value: number; minSubtotal: number; maxDiscount: number | null; quota: number | null; perUserLimit: number; startsAt: string; expiresAt: string; isActive: boolean };
export function PromoAdminForm({ promo }: { promo?: PromoFormData }) {
  const { state, formAction, pending } = useAdminForm(simpanPromoAdmin);
  return <form action={formAction} className="grid gap-4 md:grid-cols-2"><input name="existingCode" type="hidden" value={promo?.code ?? ''} /><div className="md:col-span-2"><Feedback state={state} /></div><TextField name="code" label="Kode promo" value={promo?.code} readOnly={!!promo} required state={state} /><TextField name="description" label="Deskripsi" value={promo?.description} required state={state} /><Field name="type" label="Jenis diskon" state={state}><select id="type" name="type" className={control} defaultValue={promo?.type ?? 'PERCENT'}><option value="PERCENT">Persen (%)</option><option value="FIXED">Potongan rupiah (Rp)</option></select></Field><TextField name="value" label="Nilai diskon (% atau Rp)" value={promo?.value} type="number" required state={state} /><TextField name="minSubtotal" label="Minimal subtotal (Rp)" value={promo?.minSubtotal ?? 0} type="number" required state={state} /><TextField name="maxDiscount" label="Maksimal diskon (Rp, opsional)" value={promo?.maxDiscount} type="number" state={state} /><TextField name="quota" label="Kuota (kosong = tanpa batas)" value={promo?.quota} type="number" state={state} /><TextField name="perUserLimit" label="Batas pemakaian per pengguna" value={promo?.perUserLimit ?? 1} type="number" required state={state} /><TextField name="startsAt" label="Mulai (WIB)" value={promo?.startsAt} type="datetime-local" required state={state} /><TextField name="expiresAt" label="Berakhir (WIB)" value={promo?.expiresAt} type="datetime-local" required state={state} /><CheckField name="isActive" label="Promo aktif" value={promo?.isActive ?? true} /><div className="md:col-span-2"><SaveButton pending={pending}>{promo ? 'Simpan perubahan' : 'Tambah promo'}</SaveButton></div></form>;
}

export type BannerFormData = { id: number; title: string; subtitle: string | null; cta: string | null; href: string | null; sortOrder: number; image: string; isActive: boolean };
export function BannerAdminForm({ banner }: { banner?: BannerFormData }) {
  const { state, formAction, pending } = useAdminForm(simpanBannerAdmin, 'banner');
  return <form action={formAction} className="grid gap-4 md:grid-cols-2"><input name="id" type="hidden" value={banner?.id ?? ''} /><div className="md:col-span-2"><Feedback state={state} /></div><TextField name="title" label="Judul banner" value={banner?.title} required state={state} /><TextField name="subtitle" label="Subjudul" value={banner?.subtitle} state={state} /><TextField name="cta" label="Teks tombol" value={banner?.cta} state={state} /><TextField name="href" label="Tautan halaman toko" value={banner?.href} state={state} /><TextField name="sortOrder" label="Urutan tampilan" value={banner?.sortOrder ?? 0} type="number" required state={state} /><CheckField name="isActive" label="Banner aktif" value={banner?.isActive ?? true} />{banner && <Image src={banner.image} alt={banner.title} width={500} height={200} className="max-h-48 w-full rounded-lg object-cover md:col-span-2" />}<div className="md:col-span-2"><Field name="images" label="Gambar banner (JPG/PNG/WebP, maksimal 2 MB)" state={state}><PilihGambar required={!banner} /></Field></div><div className="md:col-span-2"><SaveButton pending={pending}>{banner ? 'Simpan perubahan' : 'Tambah banner'}</SaveButton></div></form>;
}

export function OrderStatusAdminForm({ orderId, status, cod }: { orderId: number; status: OrderStatus; cod: boolean }) {
  const { state, formAction, pending } = useAdminForm(ubahStatusAdmin);
  const [target, setTarget] = useState(status === 'pending' ? 'confirmed' : status === 'confirmed' ? 'packed' : 'shipped');
  if (!['pending', 'confirmed', 'packed'].includes(status)) return <p className="text-sm text-muted-foreground">{status === 'shipped' ? 'Pesanan diselesaikan oleh pembeli atau sistem 7 hari setelah pengiriman.' : 'Pesanan sudah mencapai status akhir.'}</p>;
  return <form action={formAction} className="space-y-4"><input name="orderId" type="hidden" value={orderId} /><Feedback state={state} /><Field name="status" label="Tindakan" state={state}><select id="status" name="status" className={control} value={target} onChange={(e) => setTarget(e.target.value)}>{status === 'pending' && <><option value="confirmed">{cod ? 'Konfirmasi pesanan COD' : 'Konfirmasi pembayaran manual'}</option><option value="cancelled">Batalkan pesanan</option></>}{status === 'confirmed' && <><option value="packed">Tandai telah dikemas</option><option value="cancelled">Batalkan dan kembalikan pembayaran</option></>}{status === 'packed' && <option value="shipped">Kirim pesanan</option>}</select></Field>{target === 'cancelled' && <TextField name="alasan" label="Alasan pembatalan" required maxLength={200} state={state} />}{target !== 'cancelled' && <input name="alasan" type="hidden" value="" />}{target === 'shipped' && <TextField name="trackingNumber" label="Nomor resi" required maxLength={50} state={state} />}{target !== 'shipped' && <input name="trackingNumber" type="hidden" value="" />}<p className="text-sm text-muted-foreground">Perubahan dicatat dalam riwayat pesanan. Pembatalan mengembalikan stok dan kuota promo.</p><SaveButton pending={pending}>Perbarui status</SaveButton></form>;
}
