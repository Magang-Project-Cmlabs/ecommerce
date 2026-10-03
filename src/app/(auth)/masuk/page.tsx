import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { FormMasuk } from '@/components/auth/form-masuk';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ambilPenggunaSaatIni } from '@/lib/data/pengguna';
import { amanNext } from '@/lib/validations/auth';
import { konfigGoogle } from '@/lib/auth/google';
import { PESAN_GALAT_GOOGLE, TombolGoogle } from '@/components/auth/tombol-google';

export const metadata: Metadata = {
  title: 'Masuk',
  robots: { index: false, follow: false },
};

export default async function HalamanMasuk({ searchParams }: PageProps<'/masuk'>) {
  const { next, reset, galat } = await searchParams;
  const pesanGalat = typeof galat === 'string' ? PESAN_GALAT_GOOGLE[galat] : undefined;
  const tujuan = amanNext(typeof next === 'string' ? next : null);
  if (await ambilPenggunaSaatIni()) redirect(tujuan ?? '/');

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle>
            <h1 className="text-3xl font-medium leading-tight">Masuk ke TokoKita</h1>
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
          {pesanGalat && (
            <p role="alert" className="border-destructive/30 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-sm">
              {pesanGalat}
            </p>
          )}
          <FormMasuk next={tujuan} />
          {konfigGoogle() && <TombolGoogle next={tujuan} />}
        </CardContent>
      </Card>
    </main>
  );
}
