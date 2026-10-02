import Image from 'next/image';
import { requireAdmin } from '@/lib/auth/akses';
import { bannerAdmin } from '@/lib/data/admin';
import { hapusBannerAdmin } from '@/actions/admin';
import { AdminHeading, AdminEmpty, AksiIkon, safeQuery } from '@/components/admin/presentation';
import { BannerAdminForm, AdminMutationButton } from '@/components/admin/forms';
import { ModalAdmin } from '@/components/admin/ModalAdmin';
export default async function HalamanBannerAdmin({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin('/admin/banner');
  const params = await searchParams;
  const banners = await bannerAdmin(); const edit = Number(safeQuery(params.edit)); const selected = banners.find((b) => b.id === edit);
  const tambah = safeQuery(params.tambah) === '1';
  return <>
    <AdminHeading title="Banner beranda" description="Atur gambar promosi, tautan, status aktif, dan urutannya di beranda." action={<AksiIkon href="/admin/banner?tambah=1" label="Tambah banner" jenis="tambah" />} />
    {banners.length ? <ul className="grid gap-5 sm:grid-cols-2">{banners.map((b) => <li key={b.id} data-banner={b.id} className="overflow-hidden rounded-3xl bg-tile">
      <div className="relative aspect-[16/9] bg-muted"><Image src={b.image} alt={b.title} fill sizes="(max-width: 640px) 100vw, 600px" className="object-cover" />
        <span className={`absolute left-4 top-4 rounded-full px-2.5 py-1 text-xs font-medium ${b.isActive ? 'bg-background/90 text-foreground' : 'bg-black/60 text-white'}`}>{b.isActive ? 'Aktif' : 'Nonaktif'}</span></div>
      <div className="space-y-3 p-6">
        <div className="flex items-start justify-between gap-3"><p className="font-heading text-xl font-medium leading-tight tracking-[-0.02em]">{b.title}</p><span className="shrink-0 text-xs text-muted-foreground">Urutan {b.sortOrder}</span></div>
        {b.subtitle && <p className="text-[15px] text-muted-foreground">{b.subtitle}</p>}
        <p className="text-sm text-muted-foreground">Tautan: {b.href || 'Tanpa tautan'}</p>
        <div className="flex flex-wrap gap-2 pt-1"><AksiIkon href={`/admin/banner?edit=${b.id}`} label="Edit banner" jenis="edit" /><AdminMutationButton action={hapusBannerAdmin} data={{ id: b.id }} label="Hapus" confirmText={`Hapus banner ${b.title}?`} /></div>
      </div>
    </li>)}</ul> : <AdminEmpty>Belum ada banner. Tambahkan banner promosi beranda.</AdminEmpty>}
    {(tambah || selected) && <ModalAdmin key={selected?.id ?? 'baru'} judul={selected ? 'Edit banner' : 'Tambah banner'} deskripsi="Foto lebar 16:9 (mis. 1600 × 900) tampil paling baik di beranda." kembaliKe="/admin/banner" lebar="lebar">
      <BannerAdminForm key={selected?.id ?? 'new'} banner={selected} />
    </ModalAdmin>}
  </>;
}
