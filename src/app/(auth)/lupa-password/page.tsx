import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { FormLupaPassword } from '@/components/auth/form-lupa-password';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ambilPenggunaSaatIni } from '@/lib/data/pengguna';

export const metadata: Metadata = {
  title: 'Lupa password — TokoKita',
  robots: { index: false, follow: false },
};

export default async function HalamanLupaPassword() {
  if (await ambilPenggunaSaatIni()) redirect('/');

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle>
            <h1 className="text-xl font-semibold">Lupa password</h1>
          </CardTitle>
          <CardDescription>Masukkan email akunmu. Kami kirim link untuk membuat password baru.</CardDescription>
        </CardHeader>
        <CardContent>
          <FormLupaPassword />
        </CardContent>
      </Card>
    </main>
  );
}
