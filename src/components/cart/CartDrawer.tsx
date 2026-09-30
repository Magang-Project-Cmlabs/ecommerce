"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import {
  ArrowRight,
  Check,
  Minus,
  Plus,
  ShoppingBag,
  Tag,
  Trash2,
  X,
  Loader2,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { formatRupiah } from "@/lib/format";
import {
  useCartStore,
  selectItems,
  selectTerbuka,
  selectAppliedPromo,
  selectTotalItem,
  hitungDiskonPromo,
} from "@/stores/cart-store";
import { cekKodePromo } from "@/actions/promo";

export default function CartDrawer() {
  const items = useCartStore(selectItems);
  const terbuka = useCartStore(selectTerbuka);
  const setTerbuka = useCartStore((s) => s.setTerbuka);
  const totalItem = useCartStore(selectTotalItem);
  const ubahJumlah = useCartStore((s) => s.ubahJumlah);
  const hapusItem = useCartStore((s) => s.hapusItem);
  const kosongkanKeranjang = useCartStore((s) => s.kosongkanKeranjang);
  const appliedPromo = useCartStore(selectAppliedPromo);
  const setAppliedPromo = useCartStore((s) => s.setAppliedPromo);
  const hapusPromo = useCartStore((s) => s.hapusPromo);

  // Kalkulasi harga reaktif
  const subtotal = items.reduce((acc, i) => acc + i.price * i.quantity, 0);
  const promoKurangMin =
    appliedPromo?.minSubtotal !== undefined &&
    subtotal < appliedPromo.minSubtotal;
  const diskonPromo = hitungDiskonPromo(subtotal, appliedPromo);
  const totalAkhir = Math.max(0, subtotal - diskonPromo);

  // State form kode promo
  const [inputPromo, setInputPromo] = useState("");
  const [pesanErrorPromo, setPesanErrorPromo] = useState<string | null>(null);
  const [pesanSuksesPromo, setPesanSuksesPromo] = useState<string | null>(null);
  const [isPendingPromo, startTransitionPromo] = useTransition();

  const handleTerapkanPromo = (e: React.FormEvent) => {
    e.preventDefault();
    setPesanErrorPromo(null);
    setPesanSuksesPromo(null);

    const kode = inputPromo.trim().toUpperCase();
    if (!kode) {
      setPesanErrorPromo("Masukkan kode promo terlebih dahulu.");
      return;
    }

    startTransitionPromo(async () => {
      const res = await cekKodePromo(kode, subtotal);
      if (res.ok) {
        setAppliedPromo({
          code: res.code,
          description: res.description,
          discount: res.discount,
          type: res.type,
          value: res.value,
          minSubtotal: res.minSubtotal,
          maxDiscount: res.maxDiscount,
        });
        setPesanSuksesPromo("Kode promo berhasil dipakai.");
        setInputPromo("");
      } else {
        setPesanErrorPromo(res.message);
      }
    });
  };

  const handleHapusPromo = () => {
    hapusPromo();
    setPesanSuksesPromo(null);
    setPesanErrorPromo(null);
  };

  return (
    <Sheet open={terbuka} onOpenChange={setTerbuka}>
      <SheetContent
        side="right"
        className="flex h-full w-full flex-col bg-white p-0 sm:max-w-md"
      >
        {/* Header Drawer */}
        <SheetHeader className="border-b border-gray-100 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="text-lg font-bold text-gray-900">
                Keranjang Belanja
              </SheetTitle>
              <SheetDescription className="text-xs text-gray-500">
                {totalItem > 0
                  ? `${totalItem} barang di keranjang`
                  : "Belum ada barang"}
              </SheetDescription>
            </div>
            {items.length > 0 && (
              <button
                type="button"
                onClick={kosongkanKeranjang}
                className="text-xs text-red-600 hover:text-red-700 hover:underline"
              >
                Kosongkan
              </button>
            )}
          </div>
        </SheetHeader>

        {/* Isi Keranjang */}
        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-orange-50 text-[#FF6B00]">
              <ShoppingBag className="h-10 w-10 stroke-[1.5]" />
            </div>
            <h3 className="mt-4 text-base font-bold text-gray-800">
              Keranjang masih kosong. Yuk belanja!
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Pilih produk favoritmu dan tambahkan ke sini.
            </p>
            <Button
              type="button"
              onClick={() => setTerbuka(false)}
              className="mt-6 rounded-full bg-[#FF6B00] px-6 text-sm font-semibold text-white hover:bg-[#e85f00]"
            >
              Mulai Belanja
            </Button>
          </div>
        ) : (
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* Daftar Barang */}
            <div className="flex-1 divide-y divide-gray-100 overflow-y-auto px-6 py-2">
              {items.map((item) => {
                const itemKey = `${item.productId}-${item.variantId ?? "default"}`;
                return (
                  <div key={itemKey} className="flex gap-4 py-4">
                    {/* Gambar Produk */}
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          sizes="80px"
                          className="object-cover object-center"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-gray-400">
                          <ShoppingBag className="h-8 w-8" />
                        </div>
                      )}
                    </div>

                    {/* Informasi Produk & Aksi */}
                    <div className="flex flex-1 flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="line-clamp-2 text-sm font-semibold text-gray-900">
                            {item.name}
                          </h4>
                          <button
                            type="button"
                            onClick={() =>
                              hapusItem(item.productId, item.variantId)
                            }
                            aria-label={`Hapus ${item.name} dari keranjang`}
                            className="text-gray-400 transition-colors hover:text-red-600"
                            title="Hapus"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        {item.variantName && (
                          <p className="mt-0.5 text-xs text-gray-500">
                            Varian: {item.variantName}
                          </p>
                        )}
                        <p className="mt-1 text-sm font-bold text-[#FF6B00]">
                          {formatRupiah(item.price)}
                        </p>
                      </div>

                      {/* Kontrol Kuantitas */}
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center rounded-full border border-gray-200 bg-gray-50">
                          <button
                            type="button"
                            onClick={() =>
                              ubahJumlah(
                                item.productId,
                                item.variantId,
                                item.quantity - 1
                              )
                            }
                            aria-label={`Kurangi kuantitas ${item.name}`}
                            className="flex h-7 w-7 items-center justify-center rounded-full text-gray-600 transition-colors hover:bg-gray-200 hover:text-gray-900"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span
                            aria-label={`Kuantitas ${item.quantity}`}
                            className="w-8 text-center text-xs font-semibold text-gray-800"
                          >
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              ubahJumlah(
                                item.productId,
                                item.variantId,
                                item.quantity + 1
                              )
                            }
                            disabled={item.quantity >= 99}
                            aria-label={`Tambah kuantitas ${item.name}`}
                            className="flex h-7 w-7 items-center justify-center rounded-full text-gray-600 transition-colors hover:bg-gray-200 hover:text-gray-900 disabled:opacity-40"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <span className="text-xs font-semibold text-gray-600">
                          {formatRupiah(item.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bagian Bawah: Form Promo & Ringkasan Subtotal */}
            <div className="border-t border-gray-100 bg-gray-50/70 p-6">
              {/* Form Input Kode Promo */}
              <div className="mb-4">
                {appliedPromo ? (
                  <div
                    className={`flex items-center justify-between rounded-lg border px-3 py-2 text-xs ${
                      promoKurangMin
                        ? "border-amber-200 bg-amber-50"
                        : "border-green-200 bg-green-50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Tag
                        className={`h-4 w-4 ${
                          promoKurangMin ? "text-amber-700" : "text-green-700"
                        }`}
                      />
                      <div>
                        <span
                          className={`font-bold ${
                            promoKurangMin ? "text-amber-800" : "text-green-800"
                          }`}
                        >
                          {appliedPromo.code}
                        </span>
                        {promoKurangMin ? (
                          <p className="text-amber-700">
                            Min. belanja {formatRupiah(appliedPromo.minSubtotal!)} belum terpenuhi
                          </p>
                        ) : (
                          <p className="text-green-700">
                            {appliedPromo.description} (-{formatRupiah(diskonPromo)})
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleHapusPromo}
                      aria-label="Hapus kode promo"
                      className={`rounded p-1 ${
                        promoKurangMin
                          ? "text-amber-700 hover:bg-amber-100"
                          : "text-green-700 hover:bg-green-100"
                      }`}
                      title="Hapus promo"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleTerapkanPromo} className="space-y-1.5">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Tag className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          value={inputPromo}
                          onChange={(e) => {
                            setInputPromo(e.target.value.toUpperCase());
                            setPesanErrorPromo(null);
                          }}
                          placeholder="Kode promo (mis. HEMAT10)"
                          aria-label="Kode promo"
                          disabled={isPendingPromo}
                          className="h-9 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-xs uppercase outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00]"
                        />
                      </div>
                      <Button
                        type="submit"
                        disabled={isPendingPromo || !inputPromo.trim()}
                        className="h-9 rounded-lg bg-gray-900 px-3 text-xs font-semibold text-white hover:bg-gray-800"
                      >
                        {isPendingPromo ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Terapkan"
                        )}
                      </Button>
                    </div>

                    {pesanErrorPromo && (
                      <p className="text-[11px] text-red-600">
                        {pesanErrorPromo}
                      </p>
                    )}
                    {pesanSuksesPromo && (
                      <p className="flex items-center gap-1 text-[11px] text-green-700">
                        <Check className="h-3 w-3" /> {pesanSuksesPromo}
                      </p>
                    )}
                  </form>
                )}
              </div>

              {/* Rincian Harga */}
              <div className="space-y-1.5 border-t border-gray-200/60 pt-3 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-semibold text-gray-900">
                    {formatRupiah(subtotal)}
                  </span>
                </div>

                {appliedPromo && (
                  <div
                    className={`flex justify-between ${
                      promoKurangMin ? "text-gray-400" : "text-green-700"
                    }`}
                  >
                    <span>Diskon Promo</span>
                    <span className="font-semibold">
                      {diskonPromo > 0
                        ? `-${formatRupiah(diskonPromo)}`
                        : "Rp 0"}
                    </span>
                  </div>
                )}

                <div className="flex justify-between pt-1 text-base font-extrabold text-gray-900">
                  <span>Total Belanja</span>
                  <span className="text-[#FF6B00]">
                    {formatRupiah(totalAkhir)}
                  </span>
                </div>
              </div>

              {/* Tombol Lanjut ke Checkout */}
              <div className="mt-4">
                <Link
                  href="/checkout"
                  onClick={() => setTerbuka(false)}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#FF6B00] text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#e85f00]"
                >
                  Lanjut ke Checkout
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
