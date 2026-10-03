'use client';
import Link from 'next/link';
import { Fragment, useEffect, useRef, useState, useTransition, type ReactNode } from 'react';
import { ArrowUp, RotateCcw, Sparkles, X } from 'lucide-react';
import { tanyaAsisten } from '@/actions/asisten';
import { BATAS_PESAN_ASISTEN } from '@/lib/validations/asisten';
import { periksaPesanSensitif, samarkanSensitif } from '@/lib/asisten/sensitif';

type Pesan = { peran: 'pengguna' | 'asisten'; isi: string };
const KUNCI_SIMPAN = 'tokokita-asisten-v1';
const SAPAAN = 'Halo! Saya asisten TokoKita. Tanyakan soal produk, harga, ongkir, pembayaran, atau cara memesan.';
const SARAN = ['Metode pembayaran apa saja?', 'Bagaimana ongkir dihitung?', 'Rekomendasi produk olahraga', 'Cara membatalkan pesanan'];

// Tautan internal yang boleh dijadikan link di jawaban (hanya halaman toko).
const POLA_TAUTAN = /(\/(?:produk|kategori|akun|bantuan|wishlist|kebijakan-privasi|syarat-ketentuan|masuk|daftar)(?:\/[a-z0-9-]+)*(?:\?[a-z0-9=&-]+)?)/g;

function tebalDanTautan(teks: string, kunci: string): ReactNode[] {
  return teks.split(/(\*\*[^*]+\*\*)/g).flatMap((bagian, i) => {
    if (/^\*\*[^*]+\*\*$/.test(bagian)) return [<strong key={`${kunci}-b${i}`} className="font-semibold">{bagian.slice(2, -2)}</strong>];
    // split dengan grup tangkap: bagian berindeks ganjil adalah tautan.
    return bagian.split(POLA_TAUTAN).map((p, j) => j % 2 === 1
      ? <Link key={`${kunci}-l${i}-${j}`} href={p} className="font-medium underline underline-offset-4 hover:no-underline">{p}</Link>
      : <Fragment key={`${kunci}-t${i}-${j}`}>{p}</Fragment>);
  });
}

/** Markdown ringan dan aman (tanpa HTML): paragraf, daftar "- ", **tebal**, dan tautan halaman toko. */
function IsiJawaban({ teks }: { teks: string }) {
  const blok: ReactNode[] = [];
  let daftar: string[] = [];
  const tutupDaftar = (k: number) => { if (daftar.length) { blok.push(<ul key={`u${k}`} className="my-1 list-disc space-y-1 pl-5">{daftar.map((d, i) => <li key={i}>{tebalDanTautan(d, `u${k}-${i}`)}</li>)}</ul>); daftar = []; } };
  teks.split('\n').forEach((baris, k) => {
    const b = baris.trim();
    if (/^[-*•]\s+/.test(b)) { daftar.push(b.replace(/^[-*•]\s+/, '')); return; }
    tutupDaftar(k);
    if (b) blok.push(<p key={`p${k}`}>{tebalDanTautan(b.replace(/^#+\s*/, ''), `p${k}`)}</p>);
  });
  tutupDaftar(-1);
  return <div className="space-y-2">{blok}</div>;
}

export default function PanelAsisten({ buka, tutup }: { buka: boolean; tutup: () => void }) {
  const [riwayat, setRiwayat] = useState<Pesan[]>(() => {
    try { const s = sessionStorage.getItem(KUNCI_SIMPAN); return s ? (JSON.parse(s) as Pesan[]).slice(-20) : []; } catch { return []; }
  });
  const [teks, setTeks] = useState('');
  const [galat, setGalat] = useState<{ pesan: string; ulang: Pesan[] } | null>(null);
  const [menunggu, mulai] = useTransition();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const bawahRef = useRef<HTMLDivElement>(null);

  useEffect(() => { try { sessionStorage.setItem(KUNCI_SIMPAN, JSON.stringify(riwayat.slice(-20))); } catch { /* mode privat: riwayat cukup di memori */ } }, [riwayat]);
  useEffect(() => { if (buka) inputRef.current?.focus(); }, [buka]);
  useEffect(() => { bawahRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' }); }, [riwayat, menunggu, galat]);
  useEffect(() => {
    if (!buka) return;
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') tutup(); };
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [buka, tutup]);

  const kirim = (isi: string, dasar: Pesan[] = riwayat) => {
    const pertanyaan = isi.trim();
    if (!pertanyaan || menunggu || pertanyaan.length > BATAS_PESAN_ASISTEN) return;
    // Data sensitif tidak dikirim ke server dan hanya ditampilkan dalam bentuk tersamar.
    const tolak = periksaPesanSensitif(pertanyaan);
    if (tolak) { setRiwayat([...dasar, { peran: 'pengguna', isi: samarkanSensitif(pertanyaan) }, { peran: 'asisten', isi: tolak }]); setTeks(''); setGalat(null); return; }
    const baru: Pesan[] = [...dasar, { peran: 'pengguna', isi: pertanyaan }];
    setRiwayat(baru); setTeks(''); setGalat(null);
    mulai(async () => {
      try {
        const hasil = await tanyaAsisten({ riwayat: baru.slice(-8) });
        if (hasil.ok) setRiwayat((r) => [...r, { peran: 'asisten', isi: hasil.jawaban }]);
        else setGalat({ pesan: hasil.pesan, ulang: dasar });
      } catch {
        setGalat({ pesan: 'Koneksi terputus. Periksa internet lalu coba lagi.', ulang: dasar });
      }
    });
  };

  const terlalu = teks.length > BATAS_PESAN_ASISTEN;
  return <section id="panel-asisten" role="dialog" aria-modal="false" aria-labelledby="judul-asisten" hidden={!buka}
    className="fixed inset-x-2 bottom-[calc(8rem+env(safe-area-inset-bottom))] top-20 z-40 flex flex-col overflow-hidden rounded-3xl bg-popover text-popover-foreground shadow-[0_24px_80px_rgb(0_0_0/0.25)] ring-1 ring-foreground/10 md:inset-x-auto md:bottom-24 md:right-6 md:top-auto md:h-[min(640px,calc(100dvh-8rem))] md:w-[400px]">
    <header className="flex shrink-0 items-center gap-3 border-b border-border px-5 py-4">
      <span aria-hidden className="flex size-10 items-center justify-center rounded-full bg-foreground text-background"><Sparkles className="size-[18px]" /></span>
      <div className="min-w-0 flex-1">
        <h2 id="judul-asisten" className="font-heading text-lg font-medium leading-tight">Asisten TokoKita</h2>
        <p className="text-xs text-muted-foreground">AI · jawaban bisa keliru, cek kembali di halaman produk</p>
      </div>
      {riwayat.length > 0 && <button type="button" onClick={() => { setRiwayat([]); setGalat(null); }} title="Mulai percakapan baru" className="flex size-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/[0.06] hover:text-foreground"><RotateCcw aria-hidden className="size-[18px]" /><span className="sr-only">Mulai percakapan baru</span></button>}
      <button type="button" onClick={tutup} className="flex size-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/[0.06] hover:text-foreground"><X aria-hidden className="size-5" /><span className="sr-only">Tutup asisten</span></button>
    </header>

    <div role="log" aria-live="polite" aria-busy={menunggu} className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-5">
      <div className="max-w-[88%] rounded-3xl rounded-bl-lg bg-tile px-4 py-3 text-[15px] leading-relaxed">{SAPAAN}</div>
      {riwayat.length === 0 && <div className="flex flex-wrap gap-2 pt-1">{SARAN.map((s) => <button key={s} type="button" onClick={() => kirim(s)} className="min-h-10 rounded-full border border-border px-3.5 text-sm transition-colors hover:bg-foreground/[0.05]">{s}</button>)}</div>}
      {riwayat.map((m, i) => m.peran === 'pengguna'
        ? <p key={i} className="ml-auto w-fit max-w-[85%] whitespace-pre-wrap break-words rounded-3xl rounded-br-lg bg-foreground px-4 py-3 text-[15px] leading-relaxed text-background"><span className="sr-only">Anda: </span>{m.isi}</p>
        : <div key={i} className="max-w-[88%] break-words rounded-3xl rounded-bl-lg bg-tile px-4 py-3 text-[15px] leading-relaxed"><span className="sr-only">Asisten: </span><IsiJawaban teks={m.isi} /></div>)}
      {menunggu && <div role="status" className="flex w-fit items-center gap-1.5 rounded-3xl rounded-bl-lg bg-tile px-4 py-3.5"><span className="sr-only">Asisten sedang mengetik…</span>{[0, 1, 2].map((t) => <span key={t} aria-hidden className="size-1.5 rounded-full bg-foreground/50 motion-safe:animate-bounce" style={{ animationDelay: `${t * 150}ms` }} />)}</div>}
      {galat && <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
        <p>{galat.pesan}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <button type="button" onClick={() => { const terakhir = riwayat.at(-1); if (terakhir?.peran === 'pengguna') kirim(terakhir.isi, galat.ulang); }} className="font-medium underline underline-offset-4">Coba lagi</button>
          <Link href="/bantuan" className="font-medium underline underline-offset-4">Pusat Bantuan</Link>
        </div>
      </div>}
      <div ref={bawahRef} />
    </div>

    <form className="shrink-0 border-t border-border p-3" onSubmit={(e) => { e.preventDefault(); kirim(teks); }}>
      <div className="flex items-end gap-2 rounded-2xl border border-input bg-background p-1.5 pl-3.5 transition-[border-color,box-shadow] focus-within:border-foreground/40 focus-within:ring-2 focus-within:ring-ring/25">
        <label htmlFor="pertanyaan-asisten" className="sr-only">Pertanyaan untuk asisten</label>
        <textarea ref={inputRef} id="pertanyaan-asisten" rows={1} value={teks} maxLength={BATAS_PESAN_ASISTEN + 50} placeholder="Tulis pertanyaan…" aria-invalid={terlalu || undefined} aria-describedby="catatan-asisten"
          onChange={(e) => { setTeks(e.target.value); e.target.style.height = 'auto'; e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`; }}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); kirim(teks); } }}
          className="max-h-[120px] min-h-10 flex-1 resize-none bg-transparent py-2 text-[15px] outline-none placeholder:text-muted-foreground" />
        <button type="submit" disabled={!teks.trim() || menunggu || terlalu} className="flex size-10 shrink-0 items-center justify-center rounded-full bg-foreground text-background transition-opacity disabled:opacity-30 pointer-coarse:size-11"><ArrowUp aria-hidden className="size-5" /><span className="sr-only">Kirim pertanyaan</span></button>
      </div>
      <p id="catatan-asisten" className={`mt-2 px-1 text-xs ${terlalu ? 'text-red-700 dark:text-red-300' : 'text-muted-foreground'}`}>{terlalu ? `Pertanyaan maksimal ${BATAS_PESAN_ASISTEN} karakter (${teks.length}).` : 'Jangan bagikan password, OTP, atau data kartu. Asisten tidak bisa melihat akun Anda.'}</p>
    </form>
  </section>;
}
