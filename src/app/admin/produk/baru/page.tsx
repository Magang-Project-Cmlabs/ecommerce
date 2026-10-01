import { requireAdmin } from '@/lib/auth/akses';
import { kategoriAdmin } from '@/lib/data/admin';
import { AdminHeading } from '@/components/admin/presentation';
import { ProductAdminForm } from '@/components/admin/forms';
export default async function TambahProdukAdmin() {
  await requireAdmin('/admin/produk/baru');
  const categories = await kategoriAdmin();
  return <><AdminHeading title="Tambah produk" description="Isi informasi produk dan unggah gambar untuk mulai menjual." /><ProductAdminForm categories={categories.map(({ id, name, parentId }) => ({ id, name, parentId }))} /></>;
}
