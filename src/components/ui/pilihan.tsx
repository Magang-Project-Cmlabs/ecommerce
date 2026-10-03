'use client';
import * as React from 'react';
import { Popover as PopoverPrimitive } from 'radix-ui';
import { CheckIcon, ChevronDownIcon, SearchIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export type OpsiPilihan = { value: string; label: string; disabled?: boolean; /** Tampil menjorok (mis. subkategori di bawah induknya). */ inden?: boolean };

type Props = {
  id: string;
  /** Nama kolom form; nilainya dikirim lewat input tersembunyi (FormData, form GET, Server Action). */
  name?: string;
  options: OpsiPilihan[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  /** Kotak cari di atas daftar. Bawaan: muncul otomatis bila pilihan lebih dari 6. */
  cari?: boolean;
  disabled?: boolean;
  invalid?: boolean;
  describedBy?: string;
  className?: string;
};

// Pencocokan longgar: huruf besar/kecil dan aksen diabaikan ("kecantikan" cocok dengan "Kecantikan").
const rapikan = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

/**
 * Pengganti `<select>` bawaan browser: pemicu berbentuk kolom isian bergaya toko dan daftar
 * melayang yang ikut mode terang/gelap, dengan kotak cari untuk daftar panjang. Pola ARIA
 * combobox + listbox: `<Label htmlFor>` menamai pemicu, panah atas/bawah, Home/End, Enter, Esc,
 * dan ketik huruf awal (tanpa kotak cari) berfungsi.
 */
export function Pilihan({ id, name, options, value, defaultValue = '', onValueChange, placeholder = 'Pilih', cari, disabled, invalid, describedBy, className }: Props) {
  const [internal, setInternal] = React.useState(defaultValue);
  const nilai = value ?? internal;
  const [buka, setBuka] = React.useState(false);
  const [kata, setKata] = React.useState('');
  const [aktif, setAktif] = React.useState(-1);
  const daftarRef = React.useRef<HTMLDivElement>(null);
  const bisaCari = cari ?? options.length > 6;
  const idDaftar = `${id}-daftar`;
  const idOpsi = (i: number) => `${id}-opsi-${i}`;
  const terpilih = options.find((o) => o.value === nilai);

  const tampil = React.useMemo(() => {
    const q = rapikan(kata);
    return q ? options.filter((o) => rapikan(o.label).includes(q)) : options;
  }, [options, kata]);

  const pertamaAktif = React.useCallback((daftar: OpsiPilihan[]) => {
    const i = daftar.findIndex((o) => o.value === nilai && !o.disabled);
    return i >= 0 ? i : daftar.findIndex((o) => !o.disabled);
  }, [nilai]);

  const ubahBuka = (o: boolean) => {
    setBuka(o);
    if (o) { setKata(''); setAktif(pertamaAktif(options)); }
  };

  const pilih = (o: OpsiPilihan | undefined) => {
    if (!o || o.disabled) return;
    if (value === undefined) setInternal(o.value);
    onValueChange?.(o.value);
    setBuka(false);
  };

  const geser = (arah: 1 | -1, dari = aktif) => {
    for (let i = dari + arah, n = 0; n < tampil.length; i += arah, n++) {
      const j = (i + tampil.length) % tampil.length;
      if (!tampil[j]!.disabled) { setAktif(j); return; }
    }
  };

  // Ketik huruf awal untuk melompat (dipakai saat kotak cari tidak ada).
  const ketikan = React.useRef({ teks: '', waktu: 0 });
  const lompatKe = (huruf: string) => {
    const kini = Date.now();
    ketikan.current = { teks: kini - ketikan.current.waktu < 700 ? ketikan.current.teks + huruf : huruf, waktu: kini };
    const q = rapikan(ketikan.current.teks);
    const i = tampil.findIndex((o) => !o.disabled && rapikan(o.label).startsWith(q));
    if (i >= 0) setAktif(i);
  };

  const tombol = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); geser(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); geser(-1); }
    else if (e.key === 'Home') { e.preventDefault(); geser(1, -1); }
    else if (e.key === 'End') { e.preventDefault(); geser(-1, tampil.length); }
    else if (e.key === 'Enter' || (e.key === ' ' && !bisaCari)) { e.preventDefault(); pilih(tampil[aktif]); }
    else if (e.key === 'Tab') setBuka(false);
    else if (!bisaCari && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) lompatKe(e.key);
  };

  React.useEffect(() => {
    if (buka && aktif >= 0) document.getElementById(idOpsi(aktif))?.scrollIntoView({ block: 'nearest' });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buka, aktif]);

  // Input tersembunyi diletakkan sebelum pemicu agar utilitas space-y-* pada pembungkus tetap rapi.
  return <>
    {name && <input type="hidden" name={name} value={nilai} />}
    <PopoverPrimitive.Root open={buka} onOpenChange={ubahBuka}>
      <PopoverPrimitive.Trigger id={id} type="button" role="combobox" aria-haspopup="listbox" aria-expanded={buka} aria-controls={buka ? idDaftar : undefined}
        aria-invalid={invalid || undefined} aria-describedby={describedBy} disabled={disabled} data-placeholder={terpilih ? undefined : ''}
        onKeyDown={(e) => { if (!buka && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) { e.preventDefault(); ubahBuka(true); } }}
        className={cn('group flex h-11 w-full items-center justify-between gap-2 rounded-xl border border-input bg-background pl-4 pr-3 text-left text-[15px] text-foreground outline-none transition-[border-color,box-shadow] hover:border-foreground/30 focus-visible:border-foreground/40 focus-visible:ring-2 focus-visible:ring-ring/25 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive data-[placeholder]:text-muted-foreground data-[state=open]:border-foreground/40', className)}>
        <span className="min-w-0 truncate">{terpilih?.label ?? placeholder}</span>
        <ChevronDownIcon aria-hidden className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content align="start" sideOffset={6} collisionPadding={12}
          onOpenAutoFocus={(e) => { e.preventDefault(); (bisaCari ? (e.currentTarget as HTMLElement).querySelector('input') : daftarRef.current)?.focus(); }}
          className="z-50 flex max-h-[min(var(--radix-popover-content-available-height),24rem)] w-[var(--radix-popover-trigger-width)] min-w-[13rem] flex-col overflow-hidden rounded-2xl bg-popover text-popover-foreground shadow-[0_12px_40px_rgb(0_0_0/0.14)] ring-1 ring-foreground/10 outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 dark:shadow-[0_12px_40px_rgb(0_0_0/0.5)]">
          {bisaCari && <div className="flex shrink-0 items-center gap-2 border-b border-border px-3.5">
            <SearchIcon aria-hidden className="size-4 shrink-0 text-muted-foreground" />
            <input type="text" role="combobox" aria-label="Cari pilihan" aria-autocomplete="list" aria-expanded="true" aria-controls={idDaftar}
              aria-activedescendant={aktif >= 0 && tampil[aktif] ? idOpsi(aktif) : undefined} value={kata} placeholder="Cari…" autoComplete="off"
              onChange={(e) => { setKata(e.target.value); const q = rapikan(e.target.value); const baru = q ? options.filter((o) => rapikan(o.label).includes(q)) : options; setAktif(baru.findIndex((o) => !o.disabled)); }}
              onKeyDown={tombol} className="h-11 min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground" />
          </div>}
          <div ref={daftarRef} id={idDaftar} role="listbox" aria-labelledby={id} tabIndex={bisaCari ? -1 : 0} onKeyDown={bisaCari ? undefined : tombol}
            aria-activedescendant={!bisaCari && aktif >= 0 && tampil[aktif] ? idOpsi(aktif) : undefined} className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-1.5 outline-none">
            {tampil.length ? tampil.map((o, i) => <div key={o.value} id={idOpsi(i)} role="option" aria-selected={o.value === nilai} aria-disabled={o.disabled || undefined}
              data-aktif={i === aktif || undefined} onMouseMove={() => { if (!o.disabled && aktif !== i) setAktif(i); }} onClick={() => pilih(o)}
              className={cn('relative flex min-h-10 cursor-pointer select-none items-center rounded-xl py-2 pr-9 text-[15px] aria-disabled:pointer-events-none aria-disabled:opacity-45 aria-selected:font-medium data-[aktif]:bg-muted', o.inden && !kata ? 'pl-7 text-foreground/80' : 'pl-3')}>
              {o.label}
              {o.value === nilai && <CheckIcon aria-hidden className="absolute right-3 size-4" />}
            </div>) : <p className="px-3 py-6 text-center text-sm text-muted-foreground">Tidak ada yang cocok dengan “{kata}”.</p>}
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  </>;
}
