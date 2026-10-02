import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth/akses';
import { ambilProfilPengguna } from '@/lib/data/pengguna';
import { ambilDaftarAlamat } from '@/lib/data/alamat';
import AkunShell from '@/components/account/AkunShell';

export const metadata: Metadata = { title: 'Akun Saya', robots: { index: false, follow: false } };
export default async function HalamanAkun() {
  const pengguna = await requireUser('/akun');
  const [user, addresses] = await Promise.all([ambilProfilPengguna(pengguna.id), ambilDaftarAlamat(pengguna.id)]);
  if (!user) notFound();
  return <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 md:px-6 py-8"><h1 className="mb-2 text-4xl font-medium leading-none md:text-5xl">Pengaturan Akun</h1><p className="mb-8 text-muted-foreground">Kelola profil, keamanan password, dan alamat pengiriman Anda.</p><AkunShell user={user} initialAddresses={addresses} /></main>;
}
