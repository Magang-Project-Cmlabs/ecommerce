"use client";

import Image from "next/image";
import { Package, ShieldCheck, ShoppingBag, Tag } from "lucide-react";
import { formatRupiah } from "@/lib/format";
import type { ItemKeranjang } from "@/stores/cart-store";
import type { AppliedPromo } from "@/stores/cart-store";

type Props = {
  items: ItemKeranjang[];
  subtotal: number;
  totalWeight: number;
  shippingCost: number | null;
  promo: AppliedPromo | null;
  discount: number;
  grandTotal: number;
};

export default function RingkasanPesanan({
  items,
  subtotal,
  totalWeight,
  shippingCost,
  promo,
  discount,
  grandTotal,
}: Props) {
  return (
    <div className="rounded-3xl bg-tile p-5">
      <h3 className="border-b border-border pb-3 text-sm font-bold text-foreground">
        Ringkasan Belanja
      </h3>

      {/* Daftar Item Singkat */}
      <div className="max-h-64 divide-y divide-border overflow-y-auto py-2">
        {items.map((item) => {
          const itemKey = `${item.productId}-${item.variantId ?? "default"}`;
          return (
            <div key={itemKey} className="flex items-center gap-3 py-3">
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted-foreground/70">
                    <ShoppingBag className="h-5 w-5" />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="line-clamp-1 text-xs font-semibold text-foreground">
                  {item.name}
                </p>
                {item.variantName && (
                  <p className="text-[11px] text-muted-foreground">
                    Varian: {item.variantName}
                  </p>
                )}
                <p className="text-[11px] text-muted-foreground">
                  {item.quantity} x {formatRupiah(item.price)}
                </p>
              </div>

              <span className="text-xs font-bold text-foreground">
                {formatRupiah(item.price * item.quantity)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Rincian Biaya */}
      <div className="space-y-2 border-t border-border pt-3 text-xs">
        <div className="flex justify-between text-muted-foreground">
          <span>Subtotal Produk</span>
          <span className="font-semibold text-foreground">
            {formatRupiah(subtotal)}
          </span>
        </div>

        <div className="flex justify-between text-muted-foreground">
          <span className="flex items-center gap-1">
            <Package className="h-3.5 w-3.5 text-muted-foreground/70" />
            Total Berat
          </span>
          <span className="font-medium text-foreground/80">
            {totalWeight.toLocaleString("id-ID")} g
          </span>
        </div>

        <div className="flex justify-between text-muted-foreground">
          <span>Ongkos Kirim</span>
          {shippingCost !== null ? (
            <span className="font-semibold text-foreground">
              {formatRupiah(shippingCost)}
            </span>
          ) : (
            <span className="text-muted-foreground/70 italic">Pilih kurir</span>
          )}
        </div>

        {promo && discount > 0 && (
          <div className="flex justify-between text-green-700 dark:text-green-300">
            <span className="flex items-center gap-1">
              <Tag className="h-3.5 w-3.5" />
              Diskon Promo ({promo.code})
            </span>
            <span className="font-semibold">-{formatRupiah(discount)}</span>
          </div>
        )}

        <div className="flex justify-between border-t border-border/80 pt-2.5 text-sm font-extrabold text-foreground">
          <span>Total Belanja</span>
          <span className="text-base text-foreground">
            {formatRupiah(grandTotal)}
          </span>
        </div>
      </div>

      {/* Jaminan Keamanan */}
      <div className="mt-4 flex items-center gap-2 rounded-lg bg-muted/60 p-2.5 text-[11px] text-muted-foreground">
        <ShieldCheck className="h-4 w-4 shrink-0 text-green-600" />
        <span>Jaminan transaksi aman & pengiriman terpercaya</span>
      </div>
    </div>
  );
}
