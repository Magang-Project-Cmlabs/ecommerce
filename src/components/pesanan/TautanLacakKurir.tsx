'use client';
// Tombol "Cek di situs kurir": membuka halaman lacak resmi di tab baru dan menyalin resi.
import { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { halamanLacakKurir } from '@/lib/pengiriman/tautan-kurir';

export default function TautanLacakKurir({ kurir, resi }: { kurir: string; resi: string }) {
  const [disalin, setDisalin] = useState(false);
  const halaman = halamanLacakKurir(kurir);
  if (!halaman) return null;
  const salin = () => {
    navigator.clipboard?.writeText(resi).then(() => setDisalin(true), () => setDisalin(false));
  };
  return (
    <div className="mt-3 space-y-1">
      <a
        href={halaman.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={salin}
        className="border-input bg-background hover:bg-muted focus-visible:outline-ring inline-flex min-h-9 items-center gap-2 rounded-full border px-3 text-xs font-medium text-foreground transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 pointer-coarse:min-h-11"
      >
        <ExternalLink className="size-3.5" aria-hidden />
        Cek di situs {halaman.label}
        <span className="sr-only">(membuka tab baru)</span>
      </a>
      <p role="status" className="text-[11px] text-muted-foreground">
        {disalin ? 'Nomor resi sudah disalin. Tempel di kolom cek resi pada halaman kurir.' : 'Nomor resi otomatis disalin saat tombol diklik.'}
        {halaman.catatan && <> {halaman.catatan}</>}
      </p>
    </div>
  );
}
