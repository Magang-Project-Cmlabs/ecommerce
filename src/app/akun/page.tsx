// Halaman sementara. Isi asli dikerjakan rizkikusnadi03 (A3) di kartu
// "Halaman akun saya". Baris requireUser() WAJIB dipertahankan.

import type { Metadata } from 'next';
import { requireUser } from '@/lib/auth/akses';

export const metadata: Metadata = { title: 'Akun saya — TokoKita', robots: { index: false, follow: false } };

export default async function HalamanAkun() {
  const pengguna = await requireUser('/akun');

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-10">
      <h1 className="text-2xl font-bold">Akun saya</h1>
      <p className="text-muted-foreground mt-2 text-sm">
        Masuk sebagai <span className="text-foreground font-medium">{pengguna.name}</span> ({pengguna.email}). Profil, buku
        alamat, dan riwayat pesanan segera hadir.
      </p>
    </main>
  );
}
