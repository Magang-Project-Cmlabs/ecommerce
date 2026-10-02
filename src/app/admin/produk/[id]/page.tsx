import { notFound, redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth/akses';

// Edit produk kini berupa modal di halaman daftar; alamat lama tetap berfungsi.
export default async function EditProdukAdmin({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin('/admin/produk');
  const { id } = await params;
  if (!/^\d+$/.test(id) || !Number.isSafeInteger(Number(id))) notFound();
  return redirect(`/admin/produk?edit=${id}`);
}
