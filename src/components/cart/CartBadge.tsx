"use client";

import { useSyncExternalStore } from "react";
import { ShoppingCart } from "lucide-react";
import dynamic from "next/dynamic";
import { useCartStore, selectTotalItem, selectTerbuka } from "@/stores/cart-store";

const CartDrawer = dynamic(() => import("./CartDrawer"));

export default function CartBadge() {
  const count = useSyncExternalStore(
    useCartStore.subscribe,
    () => selectTotalItem(useCartStore.getState()),
    () => 0
  );

  const bukaKeranjang = useCartStore((s) => s.bukaKeranjang);
  const terbuka = useCartStore(selectTerbuka);

  const label = count > 0 ? `Buka keranjang, ${count} barang` : "Buka keranjang belanja";

  return (
    <>
      <button
        type="button"
        onClick={bukaKeranjang}
        aria-label={label}
        className="relative flex size-11 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"
        title={label}
      >
        <ShoppingCart className="h-8 w-8" strokeWidth={1.5} />
        {count > 0 && (
          <span
            aria-live="polite"
            className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-bold text-white shadow-sm"
          >
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>

      {terbuka && <CartDrawer />}
    </>
  );
}
