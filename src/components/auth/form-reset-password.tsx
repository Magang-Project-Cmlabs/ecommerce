'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { resetPassword } from '@/actions/auth';
import { Button } from '@/components/ui/button';
import { KolomIsian } from './kolom-isian';

export function FormResetPassword({ token }: { token: string }) {
  const [state, aksi, pending] = useActionState(resetPassword, undefined);

  return (
    <form action={aksi} className="grid gap-4" noValidate>
      <input type="hidden" name="token" value={token} />

      {state?.message && (
        <div role="alert" className="border-destructive/30 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-sm">
          {state.message}{' '}
          <Link href="/lupa-password" className="font-medium underline underline-offset-4">
            Minta link baru
          </Link>
        </div>
      )}

      <KolomIsian
        name="password"
        label="Password baru"
        type="password"
        autoComplete="new-password"
        required
        petunjuk="Minimal 8 karakter."
        errors={state?.errors?.password}
      />
      <KolomIsian
        name="confirmPassword"
        label="Ulangi password baru"
        type="password"
        autoComplete="new-password"
        required
        errors={state?.errors?.confirmPassword}
      />

      <Button type="submit" size="lg" className="h-11 w-full" disabled={pending} aria-disabled={pending}>
        {pending ? 'Menyimpan…' : 'Simpan password baru'}
      </Button>
    </form>
  );
}
