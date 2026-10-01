import Link from 'next/link';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { LABEL_STATUS_PESANAN, type OrderStatus } from '@/lib/pesanan/status';
export function AdminHeading({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div><h1 className="text-2xl font-bold">{title}</h1><p className="mt-2 text-sm text-muted-foreground">{description}</p></div>{action}</div>;
}
export function StatusBadge({ status }: { status: OrderStatus }) {
  const styles: Record<OrderStatus, string> = { pending: 'bg-amber-50 text-amber-800', confirmed: 'bg-blue-50 text-blue-700', packed: 'bg-violet-50 text-violet-700', shipped: 'bg-cyan-50 text-cyan-800', delivered: 'bg-green-50 text-green-700', cancelled: 'bg-red-50 text-red-700' };
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
