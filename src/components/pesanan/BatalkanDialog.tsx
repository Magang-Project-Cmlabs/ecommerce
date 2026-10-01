'use client';
import { useState, useTransition } from 'react';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { batalkanPesanan } from '@/actions/pesanan';
export default function BatalkanDialog({ isOpen, orderNumber, onClose, onSuccess }: { isOpen: boolean; orderNumber: string; onClose: () => void; onSuccess: () => void }) {
  const [alasan, setAlasan] = useState('Berubah pikiran / tidak jadi membeli'); const [error, setError] = useState<string | null>(null); const [pending, start] = useTransition();
  const submit = (event: React.FormEvent) => { event.preventDefault(); setError(null); start(async () => { try { const result = await batalkanPesanan(orderNumber, alasan); if (result.ok) { onSuccess(); onClose(); } else setError(result.message); } catch { setError('Pesanan belum dapat dibatalkan. Coba lagi.'); } }); };
  return <AlertDialog open={isOpen} onOpenChange={open => { if (!open && !pending) onClose(); }}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Batalkan Pesanan</AlertDialogTitle><AlertDialogDescription>Pesanan {orderNumber} akan dibatalkan. Stok dan kuota promo dikembalikan.</AlertDialogDescription></AlertDialogHeader><form onSubmit={submit}><Label htmlFor="cancel-reason">Alasan Pembatalan</Label><textarea id="cancel-reason" value={alasan} onChange={e => setAlasan(e.target.value)} required maxLength={255} className="mt-2 min-h-24 w-full rounded-lg border p-3 text-sm focus-visible:outline-2 focus-visible:outline-ring" />{error && <p role="alert" className="mt-2 text-sm text-destructive">{error}</p>}<AlertDialogFooter className="mt-4"><Button type="button" variant="outline" disabled={pending} onClick={onClose}>Kembali</Button><Button variant="destructive" disabled={pending || !alasan.trim()}>{pending ? 'Membatalkan…' : 'Ya, Batalkan Pesanan'}</Button></AlertDialogFooter></form></AlertDialogContent></AlertDialog>;
}
