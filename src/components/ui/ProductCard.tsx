import Image from "next/image";
import { ShoppingCart, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatRupiah } from "@/lib/format";

type Props = {
  name: string;
  image: string;
  rating: number;
  reviews: number;
  originalPrice: number;
  price: number;
};

export default function ProductCard({
  name,
  image,
  rating,
  reviews,
  originalPrice,
  price,
}: Props) {
  const discount = Math.round((1 - price / originalPrice) * 100);

  return (
    <Card size="sm" className="ring-0 shadow-[0_2px_10px_rgba(0,0,0,0.08)]">
      <CardContent className="flex flex-col gap-1">
        <div className="relative h-[200px] overflow-hidden rounded-md bg-[#EFEFEF]">
          <Image
            src={image}
            alt={name}
            fill
            sizes="400px"
            className="object-cover object-center transition-transform duration-300 hover:scale-105"
          />
        </div>

        <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
          <Star className="h-4 w-4 fill-[#FFA000] text-[#FFA000]" />
          <span>{rating}</span>
          <span className="text-gray-300">|</span>
          <span>{reviews} ulasan</span>
        </div>

        <h3 className="text-[15px] font-medium">{name}</h3>
        <p className="text-[13px] text-gray-400 line-through">
          {formatRupiah(originalPrice)}
        </p>

        <div className="flex items-center justify-between">
          <p className="text-[17px] font-bold">{formatRupiah(price)}</p>
          <span className="rounded bg-[#FFF0E5] px-2 py-0.5 text-xs font-semibold text-[#FF6B00]">
            {discount}% OFF
          </span>
        </div>

        <Button
          type="button"
          className="mt-2 h-10 w-full rounded-full bg-[#FF6B00] text-sm font-semibold text-white hover:bg-[#e85f00]"
        >
          <ShoppingCart className="h-4 w-4" />
          Tambah ke Keranjang
        </Button>
      </CardContent>
    </Card>
  );
}
