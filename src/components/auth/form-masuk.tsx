'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { masuk } from '@/actions/auth';
import { Button } from '@/components/ui/button';
import { KolomIsian } from './kolom-isian';

export function FormMasuk({ next }: { next: string | null }) {
  const [state, aksi, pending] = useActionState(masuk, undefined);
  const tautanDaftar = next ? `/daftar?next=${encodeURIComponent(next)}` : '/daftar';

  return (
    <form action={aksi} className="grid gap-4" noValidate>
      {next && <input type="hidden" name="next" value={next} />}

      {state?.message && (
        <p role="alert" className="border-destructive/30 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-sm">
          {state.message}
        </p>
      )}

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
        name="password"
        label="Password"
        type="password"
        autoComplete="current-password"
        required
        errors={state?.errors?.password}
      />
      <Link href="/lupa-password" className="text-muted-foreground hover:text-foreground -my-2 inline-flex min-h-11 items-center justify-self-end text-sm underline underline-offset-4">
        Lupa password?
      </Link>

      <Button type="submit" size="lg" className="h-11 w-full" disabled={pending} aria-disabled={pending}>
        {pending ? 'Memproses…' : 'Masuk'}
      </Button>

      <p className="text-muted-foreground text-center text-sm">
        Belum punya akun?{' '}
        <Link href={tautanDaftar} className="text-foreground font-medium underline underline-offset-4">
          Daftar
        </Link>
      </p>
    </form>
  );
}
