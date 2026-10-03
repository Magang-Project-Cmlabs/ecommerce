'use client';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Sparkles, X } from 'lucide-react';

// Panel (dan kodenya) baru dimuat saat pertama kali dibuka, supaya tidak menambah beban halaman.
const PanelAsisten = dynamic(() => import('./PanelAsisten'), { ssr: false });

/**
 * Tombol melayang "Tanya AI" di halaman toko (disembunyikan di admin lewat layout dan di checkout).
 * Di produksi hanya tampil bila ASISTEN_API_KEY terpasang; di development tetap tampil agar bisa diuji.
 */
export default function TombolAsisten({ aktif }: { aktif: boolean }) {
  const pathname = usePathname();
  const [buka, setBuka] = useState(false);
  const [pernahBuka, setPernahBuka] = useState(false);
  if (pathname.startsWith('/checkout') || (!aktif && process.env.NODE_ENV === 'production')) return null;
  return <>
    {pernahBuka && <PanelAsisten buka={buka} tutup={() => setBuka(false)} />}
    <button type="button" onClick={() => { setPernahBuka(true); setBuka((b) => !b); }} aria-expanded={buka} aria-controls={pernahBuka ? "panel-asisten" : undefined}
      className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] right-4 z-40 flex h-12 items-center gap-2 rounded-full bg-foreground pl-4 pr-5 text-[15px] font-medium text-background shadow-[0_8px_30px_rgb(0_0_0/0.22)] ring-1 ring-white/10 transition-transform duration-200 hover:scale-[1.03] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-safe:active:scale-95 md:bottom-6 md:right-6">
      {buka ? <X aria-hidden className="size-[18px]" /> : <Sparkles aria-hidden className="size-[18px]" />}
      <span>{buka ? 'Tutup' : 'Tanya AI'}</span>
      <span className="sr-only">{buka ? ' asisten TokoKita' : ' — asisten TokoKita'}</span>
    </button>
  </>;
}
