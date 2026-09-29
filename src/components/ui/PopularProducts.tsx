import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { products } from "@/lib/data";
import ProductCard from "./ProductCard";

export default function PopularProducts() {
  return (
    <section className="mt-8 pb-10">
      <div className="flex items-center justify-between">
        <h2 className="text-[28px] font-extrabold">Produk Terpopuler</h2>
        <Link
          href="#"
          className="flex items-center gap-1 text-[15px] font-semibold text-[#FF6B00]"
        >
          Lihat Semua <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {products.map((p) => (
          <ProductCard key={p.id} {...p} />
        ))}
      </div>
    </section>
  );
}
