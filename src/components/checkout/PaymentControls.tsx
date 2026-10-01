'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { mulaiPembayaran, cekPembayaran } from '@/actions/payment';
import SimulasiBayarButton from './SimulasiBayarButton';
export default function PaymentControls({ orderNumber, gatewayEnabled, sandbox, simulationEnabled }: { orderNumber: string; gatewayEnabled: boolean; sandbox: boolean; simulationEnabled: boolean }) {
  const router = useRouter(); const [pending, start] = useTransition(); const [message, setMessage] = useState<string | null>(null);
  const bayar = () => start(async () => { setMessage(null); try { const result = await mulaiPembayaran(orderNumber); if (result.ok) window.location.assign(result.url); else setMessage(result.message); } catch { setMessage('Pembayaran belum dapat dibuka. Coba kembali.'); } });
  const cek = () => start(async () => { try { const result = await cekPembayaran(orderNumber); setMessage(result.message); router.refresh(); } catch { setMessage('Status pembayaran belum dapat diperiksa.'); } });
  return <div className="w-full space-y-3 rounded-xl border bg-muted/30 p-4">
    {gatewayEnabled ? <><div className="flex flex-wrap gap-3"><Button disabled={pending} onClick={bayar}>{pending && <Loader2 className="size-4 animate-spin" />}Bayar Sekarang</Button><Button variant="outline" disabled={pending} onClick={cek}>Cek Pembayaran</Button></div>{sandbox && <p className="text-sm text-muted-foreground">Pembayaran demo melalui Midtrans sandbox. Gunakan simulator pembayaran untuk menyelesaikan transaksi uji.</p>}</> : <p className="text-sm">Pembayaran melalui konfirmasi manual admin. Hubungi toko untuk instruksi pembayaran dan sertakan nomor pesanan.</p>}
    {simulationEnabled && <SimulasiBayarButton orderNumber={orderNumber} isPaid={false} />}
    {message && <p role="status" className="text-sm">{message}</p>}
  </div>;
}
