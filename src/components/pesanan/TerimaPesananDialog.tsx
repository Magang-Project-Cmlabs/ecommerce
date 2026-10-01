'use client';
import { useState, useTransition } from 'react';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { konfirmasiPesananDiterima } from '@/actions/pesanan';
export default function TerimaPesananDialog({ isOpen, orderNumber, isCod, onClose, onSuccess }: { isOpen: boolean; orderNumber: string; isCod?: boolean; onClose: () => void; onSuccess: () => void }) {
  const [error, setError] = useState<string | null>(null); const [pending, start] = useTransition();
  const confirm = () => { setError(null); start(async () => { try { const result = await konfirmasiPesananDiterima(orderNumber); if (result.ok) { onSuccess(); onClose(); } else setError(result.message); } catch { setError('Pesanan belum dapat diselesaikan. Coba lagi.'); } }); };
  return <AlertDialog open={isOpen} onOpenChange={open => { if (!open && !pending) onClose(); }}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Konfirmasi Pesanan Diterima</AlertDialogTitle><AlertDialogDescription>Pastikan barang pesanan {orderNumber} sudah diterima dengan baik.{isCod && ' Dengan mengonfirmasi, pembayaran COD juga dicatat lunas.'}</AlertDialogDescription></AlertDialogHeader>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}<AlertDialogFooter><Button variant="outline" disabled={pending} onClick={onClose}>Kembali</Button><Button disabled={pending} onClick={confirm}>{pending ? 'Menyelesaikan…' : 'Ya, Pesanan Diterima'}</Button></AlertDialogFooter></AlertDialogContent></AlertDialog>;
}
