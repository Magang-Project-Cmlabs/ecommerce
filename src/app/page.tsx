import HeroBanner from "@/components/ui/HeroBanner";
import CategoryList from "@/components/ui/CategoryList";
import PopularProducts from "@/components/ui/PopularProducts";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-[1680px] px-6 pt-3">
      <HeroBanner />
      <CategoryList />
      <PopularProducts />
    </main>
  );
}
