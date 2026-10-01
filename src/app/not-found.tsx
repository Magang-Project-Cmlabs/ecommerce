import Link from 'next/link';
import { Button } from '@/components/ui/button';
export default function NotFound() { return <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-20 text-center"><p className="text-sm font-semibold text-orange-700">404</p><h1 className="mt-2 text-2xl font-bold">Halaman tidak ditemukan</h1><p className="mt-3 text-muted-foreground">Halaman atau produk ini tidak tersedia.</p><Button asChild className="mt-6 h-11"><Link href="/produk">Jelajahi Produk</Link></Button></main>; }
