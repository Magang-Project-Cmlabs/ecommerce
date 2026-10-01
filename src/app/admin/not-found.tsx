import Link from 'next/link';
import { Button } from '@/components/ui/button';
export default function AdminNotFound() { return <div className="rounded-xl border bg-background p-8 text-center"><h1 className="text-2xl font-bold">Data tidak ditemukan</h1><p className="my-4 text-sm text-muted-foreground">Data yang Anda cari tidak tersedia.</p><Button asChild className="min-h-11"><Link href="/admin">Kembali ke ringkasan</Link></Button></div>; }
