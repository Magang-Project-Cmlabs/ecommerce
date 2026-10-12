'use client';
import { useFormStatus } from 'react-dom';
import { LogOut } from 'lucide-react';
import { keluar } from '@/actions/auth';
import { useCartStore } from '@/stores/cart-store';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

function TombolYa() {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending} className="w-full sm:w-auto">{pending ? 'Mengeluarkan…' : 'Ya, keluar'}</Button>;
}

// Keranjang tinggal di localStorage perangkat, bukan di akun: kosongkan saat keluar
// supaya pengguna berikutnya di perangkat yang sama tidak melihat isinya.
async function keluarDanKosongkanKeranjang() {
  useCartStore.getState().kosongkanKeranjang();
  await keluar();
}

/** Tombol Keluar dengan konfirmasi. `ringkas`: di layar kecil hanya ikon (nama aksesibel tetap "Keluar"). */
export default function TombolKeluar({ ringkas = false, className }: { ringkas?: boolean; className?: string }) {
  return <AlertDialog>
    <AlertDialogTrigger asChild>
      <Button type="button" variant={ringkas ? 'ghost' : 'outline'} size="sm" className={className}>
        {ringkas && <LogOut aria-hidden className="sm:hidden" />}<span className={ringkas ? 'max-sm:sr-only' : undefined}>Keluar</span>
      </Button>
    </AlertDialogTrigger>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Keluar dari akun?</AlertDialogTitle>
        <AlertDialogDescription>Anda perlu masuk lagi untuk checkout, melihat pesanan, dan membuka wishlist.</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel className="w-full sm:w-auto">Batal</AlertDialogCancel>
        <form action={keluarDanKosongkanKeranjang}><TombolYa /></form>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>;
}
