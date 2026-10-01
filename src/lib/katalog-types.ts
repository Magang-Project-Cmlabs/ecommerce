export type Kategori = { id: number; name: string; slug: string; image: string | null; parentId: number | null };
export type ProdukKartu = {
  id: number; slug: string; name: string; brand: string; price: number;
  compareAtPrice: number | null; rating: number; reviewCount: number; soldCount: number;
  stock: number; isPreorder: boolean; image: string | null; hasVariants: boolean;
};
export type VarianProduk = { id: number; name: string; price: number | null; stock: number };
export type ProdukDetail = ProdukKartu & {
  description: string; specs: Record<string, string>; category: Kategori;
  variantLabel: string | null; images: string[]; variants: VarianProduk[];
  reviews: { id: number; name: string; rating: number; content: string; images: string[]; createdAt: string }[];
};
export type BannerKatalog = { id: number; title: string; subtitle: string | null; cta: string | null; href: string | null; image: string };
export type FilterKatalog = {
  q: string; kategori: string; min?: number; max?: number; rating?: number;
  brand: string; urut: 'populer' | 'termurah' | 'termahal' | 'terbaru'; hal: number;
  tampilan: 'grid' | 'list'; promo: boolean;
};
