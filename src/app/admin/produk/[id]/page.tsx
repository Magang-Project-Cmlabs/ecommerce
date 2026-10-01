import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/auth/akses';
import { detailProdukAdmin, kategoriAdmin } from '@/lib/data/admin';
import { AdminHeading } from '@/components/admin/presentation';
import { ProductAdminForm } from '@/components/admin/forms';
export default async function EditProdukAdmin({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin('/admin/produk');
  const { id } = await params;
  if (!/^\d+$/.test(id) || !Number.isSafeInteger(Number(id))) notFound();
  const [product, categories] = await Promise.all([detailProdukAdmin(Number(id)), kategoriAdmin()]);
  if (!product) notFound();
  const specs = product.specs && typeof product.specs === 'object' && !Array.isArray(product.specs) ? Object.fromEntries(Object.entries(product.specs).map(([key, value]) => [key, String(value)])) : {};
  return <><AdminHeading title="Edit produk" description={product.name} /><ProductAdminForm categories={categories.map(({ id, name, parentId }) => ({ id, name, parentId }))} product={{ id: product.id, version: product.updatedAt.toISOString(), name: product.name, slug: product.slug, description: product.description, brand: product.brand, categoryId: product.categoryId, price: product.price, compareAtPrice: product.compareAtPrice, weight: product.weight, stock: product.stock, variantLabel: product.variantLabel, isActive: product.isActive, isFeatured: product.isFeatured, isPreorder: product.isPreorder, tags: Array.isArray(product.tags) ? product.tags.map(String) : [], specs, images: product.images.map((i) => ({ url: i.url })), variants: product.variants.map((v) => ({ id: v.id, name: v.name, price: v.price, weight: v.weight, stock: v.stock, used: v._count.orderItems > 0 })) }} /></>;
}
