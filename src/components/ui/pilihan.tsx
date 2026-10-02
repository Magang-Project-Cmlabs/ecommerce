'use client';
import * as React from 'react';
import { Select as SelectPrimitive } from 'radix-ui';
import { CheckIcon, ChevronDownIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export type OpsiPilihan = { value: string; label: string; disabled?: boolean; /** Tampil menjorok (mis. subkategori di bawah induknya). */ inden?: boolean };

// Radix Select tidak menerima value kosong, padahal "Semua kategori" dkk. bernilai ''.
const KOSONG = '__kosong__';
const keRadix = (v: string) => (v === '' ? KOSONG : v);
const dariRadix = (v: string) => (v === KOSONG ? '' : v);

type Props = {
  id: string;
  /** Nama kolom form; nilainya dikirim lewat input tersembunyi (FormData, form GET, Server Action). */
  name?: string;
  options: OpsiPilihan[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  invalid?: boolean;
  describedBy?: string;
  className?: string;
};

/**
 * Pengganti `<select>` bawaan browser: pemicu berbentuk kolom isian bergaya toko dan daftar
 * pilihan melayang yang ikut mode terang/gelap. Keyboard, pembaca layar, dan `<Label htmlFor>`
 * tetap berfungsi (pemicu ber-role combobox).
 */
export function Pilihan({ id, name, options, value, defaultValue = '', onValueChange, placeholder = 'Pilih', disabled, invalid, describedBy, className }: Props) {
  const [internal, setInternal] = React.useState(defaultValue);
  const nilai = value ?? internal;
  const adaKosong = options.some((o) => o.value === '');
  // Input tersembunyi diletakkan sebelum pemicu agar utilitas space-y-* pada pembungkus tetap rapi.
  return <>
    {name && <input type="hidden" name={name} value={nilai} />}
    <SelectPrimitive.Root value={nilai === '' && !adaKosong ? undefined : keRadix(nilai)} disabled={disabled}
      onValueChange={(v) => { const asli = dariRadix(v); if (value === undefined) setInternal(asli); onValueChange?.(asli); }}>
      <SelectPrimitive.Trigger id={id} aria-invalid={invalid || undefined} aria-describedby={describedBy}
        className={cn('group flex h-11 w-full items-center justify-between gap-2 rounded-xl border border-input bg-background pl-4 pr-3 text-left text-[15px] text-foreground outline-none transition-[border-color,box-shadow] hover:border-foreground/30 focus-visible:border-foreground/40 focus-visible:ring-2 focus-visible:ring-ring/25 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive data-[placeholder]:text-muted-foreground data-[state=open]:border-foreground/40', className)}>
        <span className="min-w-0 truncate"><SelectPrimitive.Value placeholder={placeholder} /></span>
        <SelectPrimitive.Icon asChild><ChevronDownIcon aria-hidden className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" /></SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content position="popper" sideOffset={6}
          className="z-50 max-h-[min(var(--radix-select-content-available-height),22rem)] min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-2xl bg-popover p-1.5 text-popover-foreground shadow-[0_12px_40px_rgb(0_0_0/0.14)] ring-1 ring-foreground/10 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 dark:shadow-[0_12px_40px_rgb(0_0_0/0.5)]">
          <SelectPrimitive.Viewport className="max-h-[inherit] overflow-y-auto">
            {options.map((o) => <SelectPrimitive.Item key={o.value} value={keRadix(o.value)} disabled={o.disabled}
              className={`relative flex min-h-10 w-full cursor-pointer select-none items-center rounded-xl py-2 pr-9 ${o.inden ? 'pl-7 text-foreground/80' : 'pl-3'} text-[15px] outline-none data-[disabled]:pointer-events-none data-[highlighted]:bg-muted data-[state=checked]:font-medium data-[disabled]:opacity-45`}>
              <SelectPrimitive.ItemText>{o.label}</SelectPrimitive.ItemText>
              <SelectPrimitive.ItemIndicator className="absolute right-3 flex items-center"><CheckIcon aria-hidden className="size-4" /></SelectPrimitive.ItemIndicator>
            </SelectPrimitive.Item>)}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  </>;
}
