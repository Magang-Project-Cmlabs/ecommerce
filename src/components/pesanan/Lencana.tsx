import type { ReactNode } from 'react';
import { LABEL_STATUS_PEMBAYARAN, LABEL_STATUS_PESANAN, type OrderStatus, type PaymentStatus } from '@/lib/pesanan/status';
import { cn } from '@/lib/utils';

// Lencana monokrom: pil abu tipis + titik warna kecil sebagai penanda. Teks selalu warna teks
// biasa (kontras penuh di mode terang dan gelap); warna hanya di titik, tidak pernah satu-satunya
// pembawa makna karena labelnya tertulis.
export type Nada = 'kuning' | 'biru' | 'ungu' | 'langit' | 'hijau' | 'merah' | 'netral';

const TITIK: Record<Nada, string> = {
  kuning: 'bg-amber-500',
  biru: 'bg-blue-500',
  ungu: 'bg-violet-500',
  langit: 'bg-sky-500',
  hijau: 'bg-emerald-500',
  merah: 'bg-red-500',
  netral: 'bg-foreground/35',
};

export function Lencana({ nada, children, besar = false, className }: { nada: Nada; children: ReactNode; besar?: boolean; className?: string }) {
  return <span className={cn('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-foreground/[0.06] font-medium text-foreground', besar ? 'px-3 py-1.5 text-[13px]' : 'px-2.5 py-1 text-xs', nada === 'netral' && 'text-muted-foreground', className)}>
    <span aria-hidden className={cn('shrink-0 rounded-full', besar ? 'size-2' : 'size-1.5', TITIK[nada])} />
    {children}
  </span>;
}

const NADA_PESANAN: Record<OrderStatus, Nada> = {
  pending: 'kuning',
  confirmed: 'biru',
  packed: 'ungu',
  shipped: 'langit',
  delivered: 'hijau',
  cancelled: 'merah',
};

const NADA_PEMBAYARAN: Record<PaymentStatus, Nada> = { unpaid: 'kuning', paid: 'hijau', refunded: 'netral' };

export function LencanaStatus({ status, besar, className }: { status: OrderStatus; besar?: boolean; className?: string }) {
  return <Lencana nada={NADA_PESANAN[status]} besar={besar} className={className}>{LABEL_STATUS_PESANAN[status]}</Lencana>;
}

export function LencanaPembayaran({ status, besar, className }: { status: PaymentStatus; besar?: boolean; className?: string }) {
  return <Lencana nada={NADA_PEMBAYARAN[status]} besar={besar} className={className}>{LABEL_STATUS_PEMBAYARAN[status]}</Lencana>;
}
