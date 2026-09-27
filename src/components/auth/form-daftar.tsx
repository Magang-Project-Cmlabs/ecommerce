'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { daftar } from '@/actions/auth';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { KolomIsian } from './kolom-isian';

export function FormDaftar({ next }: { next: string | null }) {
  const [state, aksi, pending] = useActionState(daftar, undefined);
  const tautanMasuk = next ? `/masuk?next=${encodeURIComponent(next)}` : '/masuk';
  const galatSetuju = state?.errors?.agree;

  return (
    <form action={aksi} className="grid gap-4" noValidate>
      {next && <input type="hidden" name="next" value={next} />}

      {state?.message && (
        <p role="alert" className="border-destructive/30 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-sm">
          {state.message}
        </p>
      )}

      <KolomIsian name="name" label="Nama lengkap" autoComplete="name" required defaultValue={state?.values?.name} errors={state?.errors?.name} />
      <KolomIsian
        name="email"
        label="Email"
        type="email"
        autoComplete="email"
        inputMode="email"
        required
        defaultValue={state?.values?.email}
        errors={state?.errors?.email}
      />
      <KolomIsian
        name="phone"
        label="Nomor telepon (opsional)"
        type="tel"
        autoComplete="tel"
        inputMode="tel"
        placeholder="081234567890"
        defaultValue={state?.values?.phone}
        errors={state?.errors?.phone}
      />
      <KolomIsian
        name="password"
        label="Password"
        type="password"
        autoComplete="new-password"
        required
        petunjuk="Minimal 8 karakter."
        errors={state?.errors?.password}
      />
      <KolomIsian
        name="confirmPassword"
        label="Ulangi password"
        type="password"
        autoComplete="new-password"
        required
        errors={state?.errors?.confirmPassword}
      />

      <div className="grid gap-2">
        <div className="flex items-start gap-3">
          <Checkbox
            id="agree"
            name="agree"
            value="on"
            className="mt-0.5"
            aria-invalid={galatSetuju ? true : undefined}
            aria-describedby={galatSetuju ? 'agree-galat' : undefined}
          />
          <Label htmlFor="agree" className="text-sm leading-snug font-normal">
            <span>
              Saya menyetujui{' '}
              <Link href="/syarat-ketentuan" target="_blank" className="underline underline-offset-4">
                Syarat &amp; Ketentuan
              </Link>{' '}
              dan{' '}
              <Link href="/kebijakan-privasi" target="_blank" className="underline underline-offset-4">
                Kebijakan Privasi
              </Link>
              .
            </span>
          </Label>
        </div>
        {galatSetuju && (
          <p id="agree-galat" className="text-destructive text-sm">
            {galatSetuju[0]}
          </p>
        )}
      </div>

      <Button type="submit" size="lg" className="h-11 w-full" disabled={pending} aria-disabled={pending}>
        {pending ? 'Memproses…' : 'Daftar'}
      </Button>

      <p className="text-muted-foreground text-center text-sm">
        Sudah punya akun?{' '}
        <Link href={tautanMasuk} className="text-foreground font-medium underline underline-offset-4">
          Masuk
        </Link>
      </p>
    </form>
  );
}
