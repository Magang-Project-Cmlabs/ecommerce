"use client";

import { useSyncExternalStore } from "react";
import { ShoppingCart } from "lucide-react";
import { useCartStore, selectTotalItem } from "@/stores/cart-store";
import CartDrawer from "./CartDrawer";

export default function CartBadge() {
  const count = useSyncExternalStore(
    useCartStore.subscribe,
    () => selectTotalItem(useCartStore.getState()),
    () => 0
  );

  const bukaKeranjang = useCartStore((s) => s.bukaKeranjang);

  const label = count > 0 ? `Buka keranjang, ${count} barang` : "Buka keranjang belanja";

  return (
    <>
      <button
        type="button"
        onClick={bukaKeranjang}
        aria-label={label}
        className="relative text-gray-700 transition-colors hover:text-[#FF6B00]"
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

      <CartDrawer />
    </>
  );
}

