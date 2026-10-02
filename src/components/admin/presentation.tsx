import Link from 'next/link';
import { ChevronLeft, Eye, Pencil, Plus } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { LABEL_STATUS_PESANAN, type OrderStatus } from '@/lib/pesanan/status';
export function AdminHeading({ title, description, action, back }: { title: string; description: string; action?: ReactNode; back?: { href: string; label: string } }) {
  return <div className="mb-7">{back && <Link href={back.href} className="mb-3 inline-flex min-h-9 items-center gap-1 rounded-md text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><ChevronLeft aria-hidden className="size-4" />{back.label}</Link>}<div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div className="min-w-0"><h1 className="text-2xl font-bold tracking-tight">{title}</h1><p className="mt-1.5 text-sm text-muted-foreground">{description}</p></div>{action}</div></div>;
}
export function StatusBadge({ status }: { status: OrderStatus }) {
  const styles: Record<OrderStatus, string> = { pending: 'bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-300', confirmed: 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300', packed: 'bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300', shipped: 'bg-cyan-50 dark:bg-cyan-500/10 text-cyan-800 dark:text-cyan-300', delivered: 'bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-300', cancelled: 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300' };
  return <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${styles[status]}`}>{LABEL_STATUS_PESANAN[status]}</span>;
}
export function AdminEmpty({ children }: { children: ReactNode }) { return <div className="rounded-xl border border-dashed bg-muted/30 p-8 text-center text-sm text-muted-foreground">{children}</div>; }
export function PaginationAdmin({ page, count, pathname, query }: { page: number; count: number; pathname: string; query: Record<string, string> }) {
  const pages = Math.max(1, Math.ceil(count / 20));
  const href = (n: number) => `${pathname}?${new URLSearchParams({ ...query, page: String(n) })}`;
  return <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm"><span>{count} data · Halaman {page} dari {pages}</span><div className="flex gap-2">{page > 1 && <Button variant="outline" asChild className="min-h-10"><Link href={href(page - 1)}>Sebelumnya</Link></Button>}{page < pages && <Button variant="outline" asChild className="min-h-10"><Link href={href(page + 1)}>Berikutnya</Link></Button>}</div></div>;
}
export function safePage(value: string | string[] | undefined) { return Math.min(100_000, Math.max(1, Number.parseInt(Array.isArray(value) ? value[0] ?? '' : value ?? '1', 10) || 1)); }
export function safeQuery(value: string | string[] | undefined) { return (typeof value === 'string' ? value : '').slice(0, 200); }
export function StokBadge({ stok }: { stok: number }) {
  return <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums ${stok === 0 ? 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300' : 'bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-300'}`}>{stok === 0 ? 'Habis' : `Sisa ${stok}`}</span>;
}

/** Aksi umum: ikon + tulisan. `teks` = tulisan pendek di layar; `label` penuh menjadi nama aksesibel bila berbeda. */
export function AksiIkon({ href, label, jenis, teks }: { href: string; label: string; jenis: 'edit' | 'tambah' | 'detail'; teks?: string }) {
  const Ikon = jenis === 'edit' ? Pencil : jenis === 'detail' ? Eye : Plus;
  const tampil = teks ?? label;
  return <Button asChild variant={jenis === 'tambah' ? 'secondary' : 'outline'} size="sm" className="pointer-coarse:h-11"><Link href={href} aria-label={tampil === label ? undefined : label}><Ikon aria-hidden />{tampil}</Link></Button>;
}
