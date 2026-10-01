import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { FormMasuk } from '@/components/auth/form-masuk';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ambilPenggunaSaatIni } from '@/lib/data/pengguna';
import { amanNext } from '@/lib/validations/auth';

export const metadata: Metadata = {
  title: 'Masuk',
  robots: { index: false, follow: false },
};

export default async function HalamanMasuk({ searchParams }: PageProps<'/masuk'>) {
  const { next, reset } = await searchParams;
  const tujuan = amanNext(typeof next === 'string' ? next : null);
  if (await ambilPenggunaSaatIni()) redirect(tujuan ?? '/');

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle>
            <h1 className="text-xl font-semibold">Masuk ke TokoKita</h1>
          </CardTitle>
          <CardDescription>
            {tujuan ? 'Masuk dulu untuk melanjutkan.' : 'Masuk untuk berbelanja dan melihat pesananmu.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {reset === 'berhasil' && (
            <p role="status" className="rounded-md border border-emerald-600/30 bg-emerald-600/10 px-3 py-2 text-sm">
              Password berhasil diganti. Silakan masuk dengan password baru.
            </p>
          )}
          <FormMasuk next={tujuan} />
        </CardContent>
      </Card>
    </main>
  );
}
