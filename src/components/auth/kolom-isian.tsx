import type { ComponentProps } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Props = ComponentProps<typeof Input> & {
  name: string;
  label: string;
  errors?: string[];
  petunjuk?: string;
};

/** Label + input + pesan galat yang tersambung lewat aria-describedby. */
export function KolomIsian({ name, label, errors, petunjuk, id = name, ...props }: Props) {
  const idGalat = `${id}-galat`;
  const idPetunjuk = `${id}-petunjuk`;
  const adaGalat = !!errors?.length;
  const keterangan = [petunjuk && idPetunjuk, adaGalat && idGalat].filter(Boolean).join(' ') || undefined;

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} name={name} aria-invalid={adaGalat || undefined} aria-describedby={keterangan} {...props} />
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
