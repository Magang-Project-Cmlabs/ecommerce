import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ambilKategori } from '@/lib/data/katalog';
import CatalogPage from '@/components/product/CatalogPage';
import { parseFilterKatalog } from '@/lib/validations/katalog';
export async function generateMetadata({ params }: PageProps<'/kategori/[slug]'>): Promise<Metadata> {
  const { slug } = await params; const kategori = (await ambilKategori()).find((k) => k.slug === slug);
  return { title: kategori?.name || 'Kategori', alternates: { canonical: `/kategori/${slug}` } };
}
export default async function KategoriPage({ params, searchParams }: PageProps<'/kategori/[slug]'>) {
  const { slug } = await params; const kategori = (await ambilKategori()).find((k) => k.slug === slug);
  if (!kategori) notFound();
  const filter = parseFilterKatalog({ ...await searchParams, kategori: slug });
  return <CatalogPage title={kategori.name} filter={filter} base="/produk" />;
}
