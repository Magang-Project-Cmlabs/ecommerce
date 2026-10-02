'use client';
import { Button } from '@/components/ui/button';
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) { return <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 md:px-6 py-20 text-center"><h1 className="text-4xl font-medium leading-none md:text-5xl">Halaman belum dapat dimuat</h1><p className="mt-3 text-muted-foreground">Terjadi kendala. Silakan coba kembali beberapa saat lagi.</p><Button className="mt-6 h-11" onClick={reset}>Coba lagi</Button></main>; }
