"use client";

import { useSyncExternalStore } from "react";
import { ShoppingBag } from "lucide-react";
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
        className="relative flex size-11 items-center justify-center rounded-full text-foreground transition-colors hover:bg-foreground/[0.06] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        title={label}
      >
        <ShoppingBag aria-hidden className="size-[21px]" strokeWidth={1.6} />
        {count > 0 && (
          <span
            aria-live="polite"
            className="absolute right-0.5 top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-foreground px-1 text-[10px] font-semibold tabular-nums text-background"
          >
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>

      {terbuka && <CartDrawer />}
    </>
  );
}
