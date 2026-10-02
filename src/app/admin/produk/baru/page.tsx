import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth/akses';

// Tambah produk kini berupa modal di halaman daftar; alamat lama tetap berfungsi.
export default async function TambahProdukAdmin() {
  await requireAdmin('/admin/produk/baru');
  return redirect('/admin/produk?tambah=1');
}
