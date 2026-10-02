import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { FormDaftar } from '@/components/auth/form-daftar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ambilPenggunaSaatIni } from '@/lib/data/pengguna';
import { amanNext } from '@/lib/validations/auth';

export const metadata: Metadata = {
  title: 'Daftar',
  robots: { index: false, follow: false },
};

export default async function HalamanDaftar({ searchParams }: PageProps<'/daftar'>) {
  const { next } = await searchParams;
  const tujuan = amanNext(typeof next === 'string' ? next : null);
  if (await ambilPenggunaSaatIni()) redirect(tujuan ?? '/');

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle>
            <h1 className="text-3xl font-medium leading-tight">Buat akun TokoKita</h1>
          </CardTitle>
          <CardDescription>Daftar gratis untuk checkout, melacak pesanan, dan menyimpan wishlist.</CardDescription>
        </CardHeader>
        <CardContent>
          <FormDaftar next={tujuan} />
        </CardContent>
      </Card>
    </main>
  );
}
