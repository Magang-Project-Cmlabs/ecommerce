'use client';
import { Button } from '@/components/ui/button';
export default function AdminError({ reset }: { reset: () => void }) { return <div className="rounded-xl border bg-background p-8 text-center"><h2 className="text-lg font-semibold">Panel admin belum dapat dimuat</h2><p className="my-4 text-sm text-muted-foreground">Silakan coba lagi. Jika masalah berlanjut, periksa koneksi database.</p><Button className="min-h-11" onClick={reset}>Coba lagi</Button></div>; }
