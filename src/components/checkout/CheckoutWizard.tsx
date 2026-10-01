'use client';
import { useEffect, useState, useSyncExternalStore, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCartStore, selectItems, selectAppliedPromo, type ItemKeranjang } from '@/stores/cart-store';
import type { Alamat } from '@/lib/data/alamat';
import type { KurirKode } from '@/lib/pesanan/ongkir';
import { buatPesanan, pratinjauCheckout, type Pratinjau } from '@/actions/checkout';
import DaftarAlamat from './DaftarAlamat';
import PilihanKurir from './PilihanKurir';
import PilihanPembayaran, { type MetodePembayaran } from './PilihanPembayaran';
import KonfirmasiPesanan from './KonfirmasiPesanan';
import RingkasanPesanan from './RingkasanPesanan';

const KOSONG: ItemKeranjang[] = [];
const LANGKAH = ['Alamat', 'Pengiriman', 'Pembayaran', 'Konfirmasi'];
export default function CheckoutWizard({ initialAddresses }: { initialAddresses: Alamat[]; user: { id: number; name: string; email: string } }) {
  const router = useRouter();
  const items = useSyncExternalStore(useCartStore.subscribe, () => selectItems(useCartStore.getState()), () => KOSONG);
  const appliedPromo = useSyncExternalStore(useCartStore.subscribe, () => selectAppliedPromo(useCartStore.getState()), () => null);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [addresses, setAddresses] = useState(initialAddresses);
  const [addressId, setAddressId] = useState<number | null>(initialAddresses.find(a => a.isDefault)?.id ?? initialAddresses[0]?.id ?? null);
  const [shipping, setShipping] = useState<KurirKode | null>(null);
  const [payment, setPayment] = useState<MetodePembayaran | null>(null);
  const [notes, setNotes] = useState('');
  const [previewState, setPreview] = useState<{ key: string; data: Pratinjau } | null>(null);
  const [previewError, setPreviewError] = useState<{ key: string; message: string } | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, startPreview] = useTransition();
  const [saving, startSave] = useTransition();
  const key = JSON.stringify({ items: items.map(i => ({ productId: i.productId, variantId: i.variantId, quantity: i.quantity })), addressId: addressId ?? undefined, shippingMethod: shipping ?? undefined, promoCode: appliedPromo?.code });
  const preview = previewState?.key === key ? previewState.data : null;
  const address = addresses.find(a => a.id === addressId);
  useEffect(() => {
    let active = true;
    if (JSON.parse(key).items.length === 0) return;
    startPreview(async () => {
      try { const data = await pratinjauCheckout(JSON.parse(key)); if (active) { setPreview({ key, data }); setPreviewError(null); } }
      catch { if (active) setPreviewError({ key, message: 'Harga dan stok belum dapat diperiksa. Coba lagi atau muat ulang halaman.' }); }
    });
    return () => { active = false; };
  }, [key]);
  const masalah = preview?.items.some(i => i.masalah !== null) ?? true;
  const hargaBerubah = preview?.items.some(i => items.find(x => x.productId === i.productId && x.variantId === i.variantId)?.price !== i.price);
  const kurirBoleh = preview?.shippingOptions.some(o => o.method === shipping && o.available) ?? false;
  const bisaLanjut = !!preview && !loading && !masalah && (step === 1 ? !!address : step === 2 ? kurirBoleh : !!payment);
  const buat = () => {
    if (!bisaLanjut || !addressId || !shipping || !payment || saving) return;
    setSubmitError(null);
    startSave(async () => {
      try {
        const result = await buatPesanan({ addressId, shippingMethod: shipping, paymentMethod: payment, notes, promoCode: appliedPromo?.code, items: items.map(i => ({ productId: i.productId, variantId: i.variantId, quantity: i.quantity })) });
        if (result.ok) { useCartStore.getState().kosongkanKeranjang(); router.push(`/checkout/berhasil/${result.orderNumber}`); }
        else setSubmitError(result.message ?? Object.values(result.errors ?? {}).flat().join(' ') ?? 'Pesanan belum dapat dibuat.');
      } catch { setSubmitError('Pesanan belum dapat dibuat. Coba lagi.'); }
    });
  };
  if (items.length === 0) return <div className="mx-auto max-w-7xl px-4 py-12 text-center"><h1 className="mb-4 text-2xl font-bold">Checkout</h1><p className="mb-6">Keranjang masih kosong. Yuk belanja!</p><Button asChild><Link href="/produk">Mulai Belanja</Link></Button></div>;
  return <div className="mx-auto max-w-7xl px-4 py-8">
    <h1 className="mb-6 text-2xl font-bold">Checkout</h1>
    <ol aria-label="Langkah checkout" className="mb-8 grid grid-cols-4 gap-2">{LANGKAH.map((label, i) => <li key={label} aria-current={step === i + 1 ? 'step' : undefined}><button type="button" aria-label={`Langkah ${i + 1}: ${label}`} disabled={i + 1 > step || saving} onClick={() => setStep((i + 1) as 1 | 2 | 3 | 4)} className={`flex min-h-11 w-full flex-col items-center gap-2 rounded-lg p-2 text-xs sm:flex-row sm:text-sm ${step === i + 1 ? 'bg-secondary text-secondary-foreground' : 'bg-muted'}`}><span className="flex size-6 shrink-0 items-center justify-center rounded-full border">{i + 1 < step ? <Check className="size-4" /> : i + 1}</span>{label}</button></li>)}</ol>
    {previewError?.key === key && <p role="alert" className="mb-4 rounded-lg border border-destructive p-4 text-destructive">{previewError.message}</p>}
    {hargaBerubah && <p role="status" className="mb-4 rounded-lg bg-amber-50 p-4 text-amber-900">Harga berubah sejak barang ditambahkan. Ringkasan memakai harga terbaru dari toko.</p>}
    {preview?.promo && !preview.promo.ok && <p role="alert" className="mb-4 text-destructive">{preview.promo.message}</p>}
    {preview?.items.filter(i => i.masalah).map(i => <p role="alert" key={`${i.productId}:${i.variantId}`} className="mb-2 text-destructive">{i.name}: {i.masalah === 'varian_wajib' ? 'Pilih varian terlebih dahulu.' : i.masalah === 'tidak_aktif' ? 'Produk sudah tidak dijual.' : `Stok tersedia ${Math.max(0, i.stock)}. Ubah isi keranjang.`}</p>)}
    <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]"><section className="min-w-0 rounded-xl border bg-card p-4 sm:p-6">
      {step === 1 && <DaftarAlamat addresses={addresses} selectedAddressId={addressId} onSelectAddress={id => { setAddressId(id); setShipping(null); }} onAddressAdded={a => { setAddresses(prev => [...prev.map(x => a.isDefault ? { ...x, isDefault: false } : x), a]); setAddressId(a.id); setShipping(null); }} />}
      {step === 2 && address && preview && <PilihanKurir address={address} totalWeight={preview.totalWeight} shippingOptions={preview.shippingOptions} selectedMethod={shipping} onSelectMethod={setShipping} onBackToAddress={() => setStep(1)} />}
      {step === 3 && preview && <PilihanPembayaran grandTotal={preview.grandTotal} selectedShippingMethod={shipping} selectedPaymentMethod={payment} onSelectPaymentMethod={setPayment} />}
      {step === 4 && address && preview && shipping && payment && <KonfirmasiPesanan address={address} shippingOptions={preview.shippingOptions} selectedShippingMethod={shipping} selectedPaymentMethod={payment} items={items} pratinjauItems={preview.items} subtotal={preview.subtotal} totalWeight={preview.totalWeight} shippingCost={preview.shippingCost ?? 0} promo={appliedPromo} discount={preview.discount} grandTotal={preview.grandTotal} notes={notes} onChangeNotes={setNotes} onGoToStep={setStep} isSubmitting={saving} errorMessage={submitError} />}
      {(loading || !preview) && !previewError && <p role="status" className="mt-4 flex items-center gap-2 text-muted-foreground"><Loader2 className="size-4 animate-spin" />Memeriksa harga, stok, dan ongkir…</p>}
      {submitError && <p role="alert" className="mt-4 text-destructive">{submitError}</p>}
      <div className="mt-6 flex justify-between gap-3">{step > 1 ? <Button variant="outline" disabled={saving} onClick={() => setStep((step - 1) as 1 | 2 | 3)}>Kembali</Button> : <Button asChild variant="outline"><Link href="/produk">Lanjut Belanja</Link></Button>}{step < 4 ? <Button disabled={!bisaLanjut || saving} onClick={() => setStep((step + 1) as 2 | 3 | 4)}>Lanjutkan</Button> : <Button disabled={!bisaLanjut || saving} onClick={buat}>{saving && <Loader2 className="size-4 animate-spin" />}Buat Pesanan</Button>}</div>
    </section><aside className="min-w-0">{preview ? <RingkasanPesanan items={items.map(item => { const latest = preview.items.find(i => i.productId === item.productId && i.variantId === item.variantId); return latest ? { ...item, price: latest.price, name: latest.name, image: latest.image } : item; })} subtotal={preview.subtotal} totalWeight={preview.totalWeight} shippingCost={preview.shippingCost} promo={appliedPromo} discount={preview.discount} grandTotal={preview.grandTotal} /> : <div className="rounded-xl border p-6 text-muted-foreground">Ringkasan tersedia setelah harga diperiksa.</div>}</aside></div>
  </div>;
}
