'use client';

import { useState, type ComponentProps } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

type Props = ComponentProps<typeof Input> & {
  name: string;
  label: string;
  errors?: string[];
  petunjuk?: string;
};

/** Label + input + pesan galat yang tersambung lewat aria-describedby. Kolom password mendapat tombol tampilkan/sembunyikan. */
export function KolomIsian({ name, label, errors, petunjuk, id = name, type, className, ...props }: Props) {
  const [terlihat, setTerlihat] = useState(false);
  const idGalat = `${id}-galat`;
  const idPetunjuk = `${id}-petunjuk`;
  const adaGalat = !!errors?.length;
  const keterangan = [petunjuk && idPetunjuk, adaGalat && idGalat].filter(Boolean).join(' ') || undefined;
  const kolomPassword = type === 'password';
  const input = (
    <Input
      id={id}
      name={name}
      type={kolomPassword && terlihat ? 'text' : type}
      aria-invalid={adaGalat || undefined}
      aria-describedby={keterangan}
      className={cn(kolomPassword && 'pr-12', className)}
      {...props}
    />
  );

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      {kolomPassword ? (
        <div className="relative">
          {input}
          <button
            type="button"
            onClick={() => setTerlihat((v) => !v)}
            aria-label={terlihat ? 'Sembunyikan password' : 'Tampilkan password'}
            aria-pressed={terlihat}
            aria-controls={id}
            className="text-muted-foreground hover:text-foreground focus-visible:outline-ring absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-xl focus-visible:outline-2"
          >
            {terlihat ? <EyeOff aria-hidden className="size-[18px]" /> : <Eye aria-hidden className="size-[18px]" />}
          </button>
        </div>
      ) : (
        input
      )}
      {petunjuk && (
        <p id={idPetunjuk} className="text-muted-foreground text-xs">
          {petunjuk}
        </p>
      )}
      {adaGalat && (
        <p id={idGalat} className="text-destructive text-sm">
          {errors![0]}
        </p>
      )}
    </div>
  );
}
