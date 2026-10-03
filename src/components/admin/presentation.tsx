import Link from 'next/link';
import { ChevronLeft, Eye, Pencil, Plus } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import type { OrderStatus } from '@/lib/pesanan/status';
import { Lencana, LencanaStatus } from '@/components/pesanan/Lencana';
export function AdminHeading({ title, description, action, back }: { title: string; description: string; action?: ReactNode; back?: { href: string; label: string } }) {
  return <div className="mb-9">{back && <Link href={back.href} className="mb-4 inline-flex min-h-9 items-center gap-1 rounded-full text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><ChevronLeft aria-hidden className="size-4" />{back.label}</Link>}<div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div className="min-w-0"><h1 className="text-4xl font-medium leading-none md:text-5xl">{title}</h1><p className="mt-3 text-[15px] text-muted-foreground">{description}</p></div>{action}</div></div>;
}
export function StatusBadge({ status }: { status: OrderStatus }) {
  return <LencanaStatus status={status} />;
}
export function AdminEmpty({ children }: { children: ReactNode }) { return <div className="rounded-3xl bg-tile px-6 py-12 text-center text-[15px] text-muted-foreground">{children}</div>; }
export function PaginationAdmin({ page, count, pathname, query }: { page: number; count: number; pathname: string; query: Record<string, string> }) {
  const pages = Math.max(1, Math.ceil(count / 20));
  const href = (n: number) => `${pathname}?${new URLSearchParams({ ...query, page: String(n) })}`;
  return <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm"><span className="text-muted-foreground">{count} data · Halaman {page} dari {pages}</span><div className="flex gap-2">{page > 1 && <Button variant="outline" size="sm" asChild className="pointer-coarse:h-11"><Link href={href(page - 1)}>Sebelumnya</Link></Button>}{page < pages && <Button variant="outline" size="sm" asChild className="pointer-coarse:h-11"><Link href={href(page + 1)}>Berikutnya</Link></Button>}</div></div>;
}
export function safePage(value: string | string[] | undefined) { return Math.min(100_000, Math.max(1, Number.parseInt(Array.isArray(value) ? value[0] ?? '' : value ?? '1', 10) || 1)); }
export function safeQuery(value: string | string[] | undefined) { return (typeof value === 'string' ? value : '').slice(0, 200); }
export function StokBadge({ stok }: { stok: number }) {
  return <Lencana nada={stok === 0 ? 'merah' : 'kuning'} className="tabular-nums">{stok === 0 ? 'Habis' : `Sisa ${stok}`}</Lencana>;
}

/** Aksi umum: ikon + tulisan. `teks` = tulisan pendek di layar; `label` penuh menjadi nama aksesibel bila berbeda. */
export function AksiIkon({ href, label, jenis, teks }: { href: string; label: string; jenis: 'edit' | 'tambah' | 'detail'; teks?: string }) {
  const Ikon = jenis === 'edit' ? Pencil : jenis === 'detail' ? Eye : Plus;
  const tampil = teks ?? label;
  return <Button asChild variant={jenis === 'tambah' ? 'default' : 'outline'} size={jenis === 'tambah' ? 'default' : 'sm'} className="pointer-coarse:h-11"><Link href={href} scroll={jenis === 'detail'} aria-label={tampil === label ? undefined : label}><Ikon aria-hidden />{tampil}</Link></Button>;
}
