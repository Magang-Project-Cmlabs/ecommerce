'use client';
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// Form tambah/edit admin tampil sebagai modal di atas daftar. Modal dibuka lewat URL
// (?tambah=1 atau ?edit=ID) sehingga bisa dibagikan/dimuat ulang; menutup = kembali ke daftar.
const KonteksModal = createContext<(() => void) | null>(null);

/** Dipakai form admin: menutup modal setelah simpan berhasil (null bila form tidak di dalam modal). */
export function useTutupModal() {
  return useContext(KonteksModal);
}

export function ModalAdmin({ judul, deskripsi, kembaliKe, lebar = 'sedang', children }: { judul: string; deskripsi?: string; kembaliKe: string; lebar?: 'sedang' | 'lebar'; children: ReactNode }) {
  const router = useRouter();
  const [buka, setBuka] = useState(true);
  const tutup = useCallback(() => { setBuka(false); router.replace(kembaliKe, { scroll: false }); }, [router, kembaliKe]);
  return <Dialog open={buka} onOpenChange={(o) => { if (!o) tutup(); }}>
    <DialogContent className={lebar === 'lebar' ? 'sm:max-w-3xl' : 'sm:max-w-xl'} onInteractOutside={(e) => e.preventDefault()}
      // Fokus ke panel, bukan ke kolom pertama: Radix memblok isi kolom saat fokus sehingga ketikan pertama bisa menimpa data.
      onOpenAutoFocus={(e) => { e.preventDefault(); (e.currentTarget as HTMLElement).focus(); }}>
      <DialogHeader><DialogTitle>{judul}</DialogTitle>{deskripsi ? <DialogDescription>{deskripsi}</DialogDescription> : <DialogDescription className="sr-only">Isi formulir lalu simpan.</DialogDescription>}</DialogHeader>
      <DialogBody><KonteksModal.Provider value={tutup}>{children}</KonteksModal.Provider></DialogBody>
    </DialogContent>
  </Dialog>;
}
