"use client";

import { useEffect, useState, useTransition, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CreditCard,
  FileCheck,
  MapPin,
  ShoppingBag,
  Truck,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useCartStore,
  selectItems,
  selectAppliedPromo,
  selectSubtotal,
  hitungDiskonPromo,
} from "@/stores/cart-store";
import type { Alamat } from "@/lib/data/alamat";
import type { KurirKode, OpsiPengiriman } from "@/lib/pesanan/ongkir";
import { hitungOpsiPengiriman } from "@/lib/pesanan/ongkir";
import {
  pratinjauCheckout,
  buatPesanan,
  type Pratinjau,
} from "@/actions/checkout";
import DaftarAlamat from "./DaftarAlamat";
import PilihanKurir from "./PilihanKurir";
import PilihanPembayaran, { type MetodePembayaran } from "./PilihanPembayaran";
import KonfirmasiPesanan from "./KonfirmasiPesanan";
import RingkasanPesanan from "./RingkasanPesanan";

type Props = {
  initialAddresses: Alamat[];
  user: {
    id: number;
    name: string;
    email: string;
  };
};

export default function CheckoutWizard({ initialAddresses }: Props) {
  const router = useRouter();

  // Subscribe ke cart store secara aman dari hydration mismatch
  const items = useSyncExternalStore(
    useCartStore.subscribe,
    () => selectItems(useCartStore.getState()),
    () => []
  );

  const appliedPromo = useSyncExternalStore(
    useCartStore.subscribe,
    () => selectAppliedPromo(useCartStore.getState()),
    () => null
  );

  const cartSubtotal = useSyncExternalStore(
    useCartStore.subscribe,
    () => selectSubtotal(useCartStore.getState()),
    () => 0
  );

  // State wizard 4 Langkah (PRD §3.1)
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [addresses, setAddresses] = useState<Alamat[]>(initialAddresses);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(() => {
    const defaultAddr = initialAddresses.find((a) => a.isDefault);
    return defaultAddr ? defaultAddr.id : initialAddresses[0]?.id ?? null;
  });

  const [selectedShippingMethod, setSelectedShippingMethod] =
    useState<KurirKode | null>(null);

  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<MetodePembayaran | null>(null);

  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Pratinjau server
  const [pratinjau, setPratinjau] = useState<Pratinjau | null>(null);
  const [isPendingPratinjau, startTransition] = useTransition();

  // Alamat aktif
  const selectedAddress =
    addresses.find((a) => a.id === selectedAddressId) ?? null;

  // Total berat default bila pratinjau belum selesai di-fetch (asumsi 500g per item)
  const defaultTotalWeight = items.reduce(
    (acc, i) => acc + i.quantity * 500,
    0
  );

  const activeTotalWeight = pratinjau?.totalWeight ?? defaultTotalWeight;
  const activeSubtotal = pratinjau?.subtotal ?? cartSubtotal;

  // Hitung opsi pengiriman fallback bila pratinjau server belum merespons
  const localShippingOptions: OpsiPengiriman[] = selectedAddress
    ? hitungOpsiPengiriman(activeTotalWeight, selectedAddress.city)
    : [];

  const activeShippingOptions =
    pratinjau?.shippingOptions && pratinjau.shippingOptions.length > 0
      ? pratinjau.shippingOptions
      : localShippingOptions;

  const activeShippingCost = (() => {
    if (!selectedShippingMethod) return null;
    const option = activeShippingOptions.find(
      (o) => o.method === selectedShippingMethod
    );
    return option && option.available ? option.cost : null;
  })();

  const activeDiscount = hitungDiskonPromo(activeSubtotal, appliedPromo);
  const activeGrandTotal = Math.max(
    0,
    activeSubtotal + (activeShippingCost ?? 0) - activeDiscount
  );

  // Muat pratinjau dari server setiap kali items, alamat, kurir, atau promo berubah
  useEffect(() => {
    if (items.length === 0) return;

    startTransition(async () => {
      const res = await pratinjauCheckout({
        items: items.map((i) => ({
          productId: i.productId,
          variantId: i.variantId,
          quantity: i.quantity,
        })),
        addressId: selectedAddressId ?? undefined,
        shippingMethod: selectedShippingMethod ?? undefined,
        promoCode: appliedPromo?.code ?? undefined,
      });
      setPratinjau(res);
    });
  }, [items, selectedAddressId, selectedShippingMethod, appliedPromo]);

  // Jika alamat baru ditambahkan, perbarui daftar dan pilih otomatis
  const handleAddressAdded = (alamatBaru: Alamat) => {
    setAddresses((prev) => [alamatBaru, ...prev]);
    setSelectedAddressId(alamatBaru.id);
  };

  const handleSelectAddress = (id: number) => {
    setSelectedAddressId(id);
    setSelectedShippingMethod(null);
  };

  // Eksekusi Server Action Buat Pesanan (PRD §3.4)
  const handleBuatPesanan = async () => {
    if (!selectedAddressId || !selectedShippingMethod || !selectedPaymentMethod) {
      setSubmitError("Mohon lengkapi seluruh langkah checkout terlebih dahulu.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await buatPesanan({
        addressId: selectedAddressId,
        shippingMethod: selectedShippingMethod,
        paymentMethod: selectedPaymentMethod,
        promoCode: appliedPromo?.code ?? undefined,
        notes: notes.trim() || undefined,
        items: items.map((i) => ({
          productId: i.productId,
          variantId: i.variantId,
          quantity: i.quantity,
        })),
      });

      if (!res.ok) {
        setSubmitError(
          res.message || "Gagal membuat pesanan. Silakan periksa kembali."
        );
        setIsSubmitting(false);
        return;
      }

      // Berhasil: Kosongkan keranjang di localStorage dan arahkan ke halaman sukses
      useCartStore.getState().kosongkanKeranjang();
      router.push(`/checkout/berhasil/${res.orderNumber}`);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Terjadi kesalahan jaringan."
      );
      setIsSubmitting(false);
    }
  };

  // Keranjang kosong?
  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-orange-50 text-[#FF6B00]">
          <ShoppingBag className="h-10 w-10 stroke-[1.5]" />
        </div>
        <h2 className="mt-4 text-xl font-bold text-gray-900">
          Keranjang Belanja Kosong
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Anda belum memiliki produk di keranjang belanja. Yuk cari produk menarik!
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex h-10 items-center justify-center rounded-full bg-[#FF6B00] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#e85f00]"
        >
          Mulai Belanja
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Stepper Indikator 4 Langkah (PRD §3.1) */}
      <div className="mb-8">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-center justify-between">
            {/* Langkah 1: Alamat */}
            <div className="flex flex-1 items-center">
              <button
                type="button"
                onClick={() => setStep(1)}
                className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold transition-all ${
                  step > 1
                    ? "bg-green-600 text-white cursor-pointer hover:bg-green-700"
                    : step === 1
                    ? "bg-[#FF6B00] text-white ring-4 ring-orange-100"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                {step > 1 ? <Check className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
              </button>
              <div className="ml-2 hidden sm:block">
                <p className="text-xs font-bold text-gray-900">Langkah 1</p>
                <p className="text-[11px] text-gray-500">Alamat</p>
              </div>
              <div
                className={`mx-3 h-0.5 flex-1 transition-colors ${
                  step > 1 ? "bg-green-600" : "bg-gray-200"
                }`}
              />
            </div>

            {/* Langkah 2: Kurir & Ongkir */}
            <div className="flex flex-1 items-center">
              <button
                type="button"
                disabled={step < 2}
                onClick={() => step > 2 && setStep(2)}
                className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold transition-all ${
                  step > 2
                    ? "bg-green-600 text-white cursor-pointer hover:bg-green-700"
                    : step === 2
                    ? "bg-[#FF6B00] text-white ring-4 ring-orange-100"
                    : "bg-gray-200 text-gray-500 cursor-not-allowed"
                }`}
              >
                {step > 2 ? <Check className="h-4 w-4" /> : <Truck className="h-4 w-4" />}
              </button>
              <div className="ml-2 hidden sm:block">
                <p
                  className={`text-xs font-bold ${
                    step >= 2 ? "text-gray-900" : "text-gray-400"
                  }`}
                >
                  Langkah 2
                </p>
                <p className="text-[11px] text-gray-500">Pengiriman</p>
              </div>
              <div
                className={`mx-3 h-0.5 flex-1 transition-colors ${
                  step > 2 ? "bg-green-600" : "bg-gray-200"
                }`}
              />
            </div>

            {/* Langkah 3: Pembayaran */}
            <div className="flex flex-1 items-center">
              <button
                type="button"
                disabled={step < 3}
                onClick={() => step > 3 && setStep(3)}
                className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold transition-all ${
                  step > 3
                    ? "bg-green-600 text-white cursor-pointer hover:bg-green-700"
                    : step === 3
                    ? "bg-[#FF6B00] text-white ring-4 ring-orange-100"
                    : "bg-gray-200 text-gray-500 cursor-not-allowed"
                }`}
              >
                {step > 3 ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <CreditCard className="h-4 w-4" />
                )}
              </button>
              <div className="ml-2 hidden sm:block">
                <p
                  className={`text-xs font-bold ${
                    step >= 3 ? "text-gray-900" : "text-gray-400"
                  }`}
                >
                  Langkah 3
                </p>
                <p className="text-[11px] text-gray-500">Pembayaran</p>
              </div>
              <div
                className={`mx-3 h-0.5 flex-1 transition-colors ${
                  step > 3 ? "bg-green-600" : "bg-gray-200"
                }`}
              />
            </div>

            {/* Langkah 4: Konfirmasi */}
            <div className="flex items-center">
              <button
                type="button"
                disabled={step < 4}
                className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold transition-all ${
                  step === 4
                    ? "bg-[#FF6B00] text-white ring-4 ring-orange-100"
                    : "bg-gray-200 text-gray-500 cursor-not-allowed"
                }`}
              >
                <FileCheck className="h-4 w-4" />
              </button>
              <div className="ml-2 hidden sm:block">
                <p
                  className={`text-xs font-bold ${
                    step === 4 ? "text-gray-900" : "text-gray-400"
                  }`}
                >
                  Langkah 4
                </p>
                <p className="text-[11px] text-gray-500">Konfirmasi</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Konten Utama: 2 Kolom (Form Wizard di Kiri, Ringkasan di Kanan) */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Kolom Kiri: Wizard Steps */}
        <div className="lg:col-span-8">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-xs">
            {/* Langkah 1: Alamat */}
            {step === 1 && (
              <div className="space-y-6">
                <DaftarAlamat
                  addresses={addresses}
                  selectedAddressId={selectedAddressId}
                  onSelectAddress={handleSelectAddress}
                  onAddressAdded={handleAddressAdded}
                />

                <div className="flex justify-end border-t border-gray-100 pt-4">
                  <Button
                    type="button"
                    disabled={!selectedAddressId}
                    onClick={() => setStep(2)}
                    className="h-10 gap-2 rounded-full bg-[#FF6B00] px-6 text-xs font-bold text-white hover:bg-[#e85f00] disabled:opacity-50"
                  >
                    Lanjut ke Pengiriman
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Langkah 2: Pengiriman */}
            {step === 2 && selectedAddress && (
              <div className="space-y-6">
                <PilihanKurir
                  address={selectedAddress}
                  totalWeight={activeTotalWeight}
                  shippingOptions={activeShippingOptions}
                  selectedMethod={selectedShippingMethod}
                  onSelectMethod={(m) => setSelectedShippingMethod(m)}
                  onBackToAddress={() => setStep(1)}
                />

                <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="h-10 gap-2 rounded-full text-xs font-semibold"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Kembali ke Alamat
                  </Button>

                  <Button
                    type="button"
                    disabled={!selectedShippingMethod}
                    onClick={() => setStep(3)}
                    className="h-10 gap-2 rounded-full bg-[#FF6B00] px-6 text-xs font-bold text-white hover:bg-[#e85f00] disabled:opacity-50"
                  >
                    Lanjut ke Pembayaran
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Langkah 3: Pembayaran */}
            {step === 3 && (
              <div className="space-y-6">
                <PilihanPembayaran
                  grandTotal={activeGrandTotal}
                  selectedShippingMethod={selectedShippingMethod}
                  selectedPaymentMethod={selectedPaymentMethod}
                  onSelectPaymentMethod={(m) => setSelectedPaymentMethod(m)}
                />

                <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(2)}
                    className="h-10 gap-2 rounded-full text-xs font-semibold"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Kembali ke Pengiriman
                  </Button>

                  <Button
                    type="button"
                    disabled={!selectedPaymentMethod}
                    onClick={() => setStep(4)}
                    className="h-10 gap-2 rounded-full bg-[#FF6B00] px-6 text-xs font-bold text-white hover:bg-[#e85f00] disabled:opacity-50"
                  >
                    Lanjut ke Konfirmasi
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Langkah 4: Konfirmasi Pesanan */}
            {step === 4 &&
              selectedAddress &&
              selectedShippingMethod &&
              selectedPaymentMethod && (
                <div className="space-y-6">
                  <KonfirmasiPesanan
                    address={selectedAddress}
                    shippingOptions={activeShippingOptions}
                    selectedShippingMethod={selectedShippingMethod}
                    selectedPaymentMethod={selectedPaymentMethod}
                    items={items}
                    pratinjauItems={pratinjau?.items}
                    subtotal={activeSubtotal}
                    totalWeight={activeTotalWeight}
                    shippingCost={activeShippingCost ?? 0}
                    promo={appliedPromo}
                    discount={activeDiscount}
                    grandTotal={activeGrandTotal}
                    notes={notes}
                    onChangeNotes={setNotes}
                    onGoToStep={(targetStep) => setStep(targetStep)}
                    isSubmitting={isSubmitting}
                    errorMessage={submitError}
                  />

                  <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isSubmitting}
                      onClick={() => setStep(3)}
                      className="h-10 gap-2 rounded-full text-xs font-semibold"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Kembali ke Pembayaran
                    </Button>

                    <Button
                      type="button"
                      disabled={isSubmitting}
                      onClick={handleBuatPesanan}
                      className="h-11 gap-2 rounded-full bg-[#FF6B00] px-8 text-sm font-bold text-white shadow-md hover:bg-[#e85f00] disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Memproses Pesanan...
                        </>
                      ) : (
                        <>
                          Buat Pesanan Sekarang
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
          </div>
        </div>

        {/* Kolom Kanan: Ringkasan Pesanan */}
        <div className="lg:col-span-4">
          <div className="sticky top-24 space-y-4">
            <RingkasanPesanan
              items={items}
              subtotal={activeSubtotal}
              totalWeight={activeTotalWeight}
              shippingCost={activeShippingCost}
              promo={appliedPromo}
              discount={activeDiscount}
              grandTotal={activeGrandTotal}
            />

            {isPendingPratinjau && (
              <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Menghitung ulang rincian pesanan...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
