import Link from 'next/link';
import { Button } from '@/components/ui/button';
export default function NotFound() { return <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 md:px-6 py-20 text-center"><p className="text-sm font-semibold text-foreground">404</p><h1 className="mt-2 text-4xl font-medium leading-none md:text-5xl">Halaman tidak ditemukan</h1><p className="mt-3 text-muted-foreground">Halaman atau produk ini tidak tersedia.</p><Button asChild className="mt-6 h-11"><Link href="/produk">Jelajahi Produk</Link></Button></main>; }
