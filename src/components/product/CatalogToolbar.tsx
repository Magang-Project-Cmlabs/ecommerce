'use client';
import { useRouter } from 'next/navigation';
import { Grid2X2, List } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Label } from '@/components/ui/label';
import type { FilterKatalog } from '@/lib/katalog-types';
import { Pilihan } from '@/components/ui/pilihan';
export function urlFilter(filter: FilterKatalog, perubahan: Partial<FilterKatalog> = {}, base = '/produk') {
  const f = { ...filter, ...perubahan }; const query = new URLSearchParams();
  for (const [k, v] of Object.entries(f)) if (v !== undefined && v !== '' && v !== false) query.set(k, k === 'promo' ? '1' : String(v));
  return `${base}?${query}`;
}
export default function CatalogToolbar({ filter, base }: { filter: FilterKatalog; base: string }) {
  const router = useRouter();
  return <div className="flex flex-wrap items-center gap-3"><Label htmlFor="urutan-produk" className="sr-only">Urutkan produk</Label><Pilihan id="urutan-produk" value={filter.urut} onValueChange={(v) => router.push(urlFilter(filter, { urut: v as FilterKatalog['urut'], hal: 1 }, base))} className="w-44" options={[{ value: 'populer', label: 'Terpopuler' }, { value: 'termurah', label: 'Termurah' }, { value: 'termahal', label: 'Termahal' }, { value: 'terbaru', label: 'Terbaru' }]} /><ToggleGroup type="single" value={filter.tampilan} onValueChange={(v) => { if (v) router.push(urlFilter(filter, { tampilan: v as 'grid' | 'list' }, base)); }} aria-label="Tampilan produk"><ToggleGroupItem value="grid" aria-label="Tampilan grid" className="size-11"><Grid2X2 /></ToggleGroupItem><ToggleGroupItem value="list" aria-label="Tampilan list" className="size-11"><List /></ToggleGroupItem></ToggleGroup></div>;
}
