import Link from 'next/link';
import Image from 'next/image';
import { requireAdmin } from '@/lib/auth/akses';
import { bannerAdmin } from '@/lib/data/admin';
import { hapusBannerAdmin } from '@/actions/admin';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminHeading, AdminEmpty, safeQuery } from '@/components/admin/presentation';
import { BannerAdminForm, AdminMutationButton } from '@/components/admin/forms';
export default async function HalamanBannerAdmin({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin('/admin/banner');
  const banners = await bannerAdmin(); const edit = Number(safeQuery((await searchParams).edit)); const selected = banners.find((b) => b.id === edit);
  return <><AdminHeading title="Banner beranda" description="Atur gambar promosi, tautan, status aktif, dan urutannya di beranda." />{banners.length ? <div className="mb-7 grid gap-4 sm:grid-cols-2">{banners.map((b) => <Card key={b.id}><Image src={b.image} alt={b.title} width={600} height={220} className="aspect-[3/1] w-full object-cover" /><CardContent className="space-y-3"><div className="flex justify-between gap-2"><p className="font-semibold">{b.title}</p><span className="text-xs text-muted-foreground">Urutan {b.sortOrder}</span></div><p className="text-sm text-muted-foreground">{b.subtitle}</p><p className="text-sm">{b.isActive ? 'Aktif' : 'Nonaktif'} · {b.href || 'Tanpa tautan'}</p><div className="flex flex-wrap gap-2"><Button asChild variant="outline" className="min-h-10"><Link href={`/admin/banner?edit=${b.id}`}>Edit banner</Link></Button><AdminMutationButton action={hapusBannerAdmin} data={{ id: b.id }} label="Hapus" confirmText={`Hapus banner ${b.title}?`} /></div></CardContent></Card>)}</div> : <div className="mb-7"><AdminEmpty>Belum ada banner. Tambahkan banner promosi beranda.</AdminEmpty></div>}<Card><CardHeader><CardTitle>{selected ? 'Edit banner' : 'Tambah banner'}</CardTitle>{selected && <Link href="/admin/banner" className="text-sm text-secondary underline">Tambah banner baru</Link>}</CardHeader><CardContent><BannerAdminForm key={selected?.id ?? 'new'} banner={selected} /></CardContent></Card></>;
}
