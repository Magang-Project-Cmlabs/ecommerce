'use client';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { SlidersHorizontal, Loader2 } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { FilterKatalog, Kategori } from '@/lib/katalog-types';
import { Pilihan } from '@/components/ui/pilihan';

export default function CatalogFilters({ filter, categories, brands, base }: { filter: FilterKatalog; categories: Kategori[]; brands: string[]; base: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const form = (suffix: string) => <form className="space-y-5" onSubmit={(e) => {
    e.preventDefault(); const data = new FormData(e.currentTarget); const params = new URLSearchParams();
    for (const [key, value] of data) { if (String(value).trim()) params.set(key, String(value).trim()); }
    startTransition(() => router.push(`${base}?${params}`));
  }}>
    <input type="hidden" name="q" value={filter.q} /><input type="hidden" name="urut" value={filter.urut} /><input type="hidden" name="tampilan" value={filter.tampilan} />{filter.promo && <input type="hidden" name="promo" value="1" />}
    <div><Label htmlFor={`filter-kategori-${suffix}`}>Kategori</Label><Pilihan id={`filter-kategori-${suffix}`} name="kategori" defaultValue={filter.kategori} className="mt-2" options={[{ value: '', label: 'Semua kategori' }, ...categories.filter((c) => c.parentId === null).flatMap((induk) => [{ value: induk.slug, label: induk.name }, ...categories.filter((c) => c.parentId === induk.id).map((c) => ({ value: c.slug, label: c.name, inden: true }))])]} /></div>
    <fieldset><legend className="text-sm font-medium">Rentang Harga</legend><div className="mt-2 space-y-2"><Label htmlFor={`filter-min-${suffix}`} className="sr-only">Harga minimum</Label><Input id={`filter-min-${suffix}`} name="min" type="number" min="0" max="2147483647" placeholder="Minimum, Rp" defaultValue={filter.min} className="h-11" /><Label htmlFor={`filter-max-${suffix}`} className="sr-only">Harga maksimum</Label><Input id={`filter-max-${suffix}`} name="max" type="number" min="0" max="2147483647" placeholder="Maksimum, Rp" defaultValue={filter.max} className="h-11" /></div></fieldset>
    <div><Label htmlFor={`filter-rating-${suffix}`}>Rating Minimum</Label><Pilihan id={`filter-rating-${suffix}`} name="rating" defaultValue={filter.rating ? String(filter.rating) : ''} className="mt-2" options={[{ value: '', label: 'Semua rating' }, ...[4, 3, 2, 1].map((r) => ({ value: String(r), label: `${r} bintang ke atas` }))]} /></div>
    <div><Label htmlFor={`filter-brand-${suffix}`}>Merek</Label><Pilihan id={`filter-brand-${suffix}`} name="brand" defaultValue={filter.brand} className="mt-2" options={[{ value: '', label: 'Semua merek' }, ...brands.map((b) => ({ value: b, label: b }))]} /></div>
    <Button type="submit" className="h-11 w-full" disabled={pending}>{pending && <Loader2 className="size-4 animate-spin" />}Terapkan Filter</Button><Button type="button" variant="outline" className="h-11 w-full" onClick={() => router.push('/produk')}>Hapus Filter</Button>
  </form>;
  return <><aside className="hidden w-56 shrink-0 space-y-5 rounded-xl border p-4 lg:block"><h2 className="font-semibold">Filter Produk</h2>{form('desktop')}</aside><div className="lg:hidden"><Sheet><SheetTrigger asChild><Button variant="outline" className="h-11"><SlidersHorizontal className="size-4" />Filter Produk</Button></SheetTrigger><SheetContent side="left" className="overflow-y-auto"><SheetHeader><SheetTitle>Filter Produk</SheetTitle></SheetHeader><div className="p-4">{form('mobile')}</div></SheetContent></Sheet></div></>;
}
