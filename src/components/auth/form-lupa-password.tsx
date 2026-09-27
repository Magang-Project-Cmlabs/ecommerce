'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { lupaPassword } from '@/actions/auth';
import { Button } from '@/components/ui/button';
import { KolomIsian } from './kolom-isian';

export function FormLupaPassword() {
  const [state, aksi, pending] = useActionState(lupaPassword, undefined);

  if (state?.terkirim) {
    return (
      <div className="grid gap-4">
        {/* Pesan sama persis untuk email terdaftar maupun tidak (PRD §10.9). */}
        <p role="status" className="rounded-md border border-emerald-600/30 bg-emerald-600/10 px-3 py-2 text-sm">
          Jika <strong className="break-all">{state.values?.email}</strong> terdaftar, kami sudah mengirim link untuk
          membuat password baru. Cek kotak masuk dan folder spam. Link berlaku 1 jam.
        </p>
        <Button asChild size="lg" variant="outline" className="h-11 w-full">
          <Link href="/masuk">Kembali ke halaman masuk</Link>
        </Button>
      </div>
    );
  }

  return (
    <form action={aksi} className="grid gap-4" noValidate>
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

      <Button type="submit" size="lg" className="h-11 w-full" disabled={pending} aria-disabled={pending}>
        {pending ? 'Mengirim…' : 'Kirim link reset'}
      </Button>

      <p className="text-muted-foreground text-center text-sm">
        Sudah ingat?{' '}
        <Link href="/masuk" className="text-foreground font-medium underline underline-offset-4">
          Masuk
        </Link>
      </p>
    </form>
  );
}
