import type { Metadata } from 'next';
import Link from 'next/link';
import { FormResetPassword } from '@/components/auth/form-reset-password';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { hashTokenReset, tokenResetBerbentukSah } from '@/lib/auth/token-reset';
import { tokenResetMasihBerlaku } from '@/lib/data/reset-password';

export const metadata: Metadata = {
  title: 'Buat password baru',
  robots: { index: false, follow: false },
  // Token ada di URL: jangan bocorkan lewat header Referer ke situs lain.
  referrer: 'no-referrer',
};

export default async function HalamanResetPassword({ searchParams }: PageProps<'/reset-password'>) {
  const { token } = await searchParams;
  const berlaku = tokenResetBerbentukSah(token) && (await tokenResetMasihBerlaku(hashTokenReset(token)));

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle>
            <h1 className="text-3xl font-medium leading-tight">{berlaku ? 'Buat password baru' : 'Link tidak berlaku'}</h1>
          </CardTitle>
          <CardDescription>
            {berlaku
              ? 'Setelah disimpan, masuk lagi dengan password barumu.'
              : 'Link reset hanya berlaku 1 jam dan sekali pakai. Minta link baru untuk melanjutkan.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {berlaku ? (
            <FormResetPassword token={token} />
          ) : (
            <Button asChild size="lg" className="h-11 w-full">
              <Link href="/lupa-password">Minta link baru</Link>
            </Button>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
