'use client';
// Tombol dan linimasa lacak paket (D20). Pelacakan hanya dijalankan saat diminta.
import { useState, useTransition } from 'react';
import { Loader2, MapPin, PackageSearch } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { lacakPesanan, type HasilLacakPesanan } from '@/actions/lacak';
import { formatTanggalWIB } from '@/lib/format';

const PESAN: Record<Exclude<HasilLacakPesanan['status'], 'ok' | 'dibatasi'>, string> = {
  'tidak-ditemukan': 'Resi belum terdaftar di sistem kurir. Coba lagi beberapa jam setelah paket dikirim.',
  'tidak-didukung': 'Pelacakan otomatis belum tersedia untuk kurir ini. Gunakan aplikasi kurir dengan nomor resi di atas.',
  'tidak-dikonfigurasi': 'Pelacakan otomatis belum aktif.',
  gagal: 'Layanan pelacakan sedang tidak bisa dihubungi. Coba lagi nanti.',
};

export default function LacakPaket({ orderNumber }: { orderNumber: string }) {
  const [hasil, setHasil] = useState<HasilLacakPesanan | null>(null);
  const [pending, start] = useTransition();
  const lacak = () => start(async () => {
    try { setHasil(await lacakPesanan(orderNumber)); } catch { setHasil({ status: 'gagal' }); }
  });

  return (
    <div className="mt-3 space-y-3">
      <Button type="button" variant="outline" size="sm" onClick={lacak} disabled={pending} className="pointer-coarse:h-11">
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <PackageSearch className="size-4" aria-hidden />}
        {hasil ? 'Perbarui pelacakan' : 'Lacak paket'}
      </Button>
      <div aria-live="polite">
        {hasil?.status === 'ok' && (
          <div className="space-y-3 rounded-xl bg-background p-4 text-foreground">
            <p className="text-sm font-semibold">{hasil.ringkasan.status}</p>
            {hasil.ringkasan.keterangan && <p className="text-xs text-muted-foreground">{hasil.ringkasan.keterangan}</p>}
            {hasil.riwayat.length === 0 ? (
              <p className="text-xs text-muted-foreground">Belum ada riwayat dari kurir.</p>
            ) : (
              <ol aria-label="Riwayat pengiriman" className="space-y-3 border-l border-border pl-4">
                {hasil.riwayat.map((r, i) => (
                  <li key={`${r.waktu}-${i}`} className="relative">
                    <span aria-hidden className={`absolute -left-[21px] top-1.5 size-2.5 rounded-full ${i === 0 ? 'bg-foreground' : 'bg-border'}`} />
                    <p className="text-xs font-medium">{r.keterangan}</p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-muted-foreground">
                      {r.waktu && <span>{formatTanggalWIB(r.waktu)}</span>}
                      {r.lokasi && <span className="inline-flex items-center gap-1"><MapPin className="size-3" aria-hidden />{r.lokasi}</span>}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}
        {hasil?.status === 'dibatasi' && (
          <p role="status" className="text-xs text-muted-foreground">Terlalu sering melacak. Coba lagi dalam {Math.max(1, Math.ceil(hasil.tungguDetik / 60))} menit.</p>
        )}
        {hasil && hasil.status !== 'ok' && hasil.status !== 'dibatasi' && (
          <p role="status" className="text-xs text-muted-foreground">{PESAN[hasil.status]}</p>
        )}
      </div>
    </div>
  );
}
