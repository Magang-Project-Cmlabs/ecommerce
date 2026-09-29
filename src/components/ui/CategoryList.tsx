import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { categories } from "@/lib/data";

export default function CategoryList() {
  return (
    <section className="mt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-[28px] font-extrabold">Kategori Populer</h2>
        <Link
          href="#"
          className="flex items-center gap-1 text-[15px] font-semibold text-[#FF6B00]"
        >
          Lihat Semua <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="mt-4 grid grid-cols-5 gap-y-6 lg:grid-cols-10">
        {categories.map(({ name, icon: Icon }) => (
          <Link
            key={name}
            href="#"
            className="flex flex-col items-center gap-2 text-center"
          >
            <span className="flex h-[84px] w-[84px] items-center justify-center rounded-full bg-[#FF6B00] text-white">
              <Icon className="h-11 w-11" strokeWidth={1.5} />
            </span>
            <span className="max-w-[110px] text-[15px] font-medium leading-tight">
              {name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
