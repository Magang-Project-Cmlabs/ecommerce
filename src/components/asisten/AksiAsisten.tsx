'use client';
// Tombol aksi di bawah jawaban asisten (D23). Semua aksi baru berjalan saat pembeli menekannya.
// Data kartu produk berasal dari database (lewat Server Action), bukan dari teks model.

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { Banknote, Check, CreditCard, MapPin, Plus, ShoppingBag, Star, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatRupiah } from '@/lib/format';
import { useCartStore } from '@/stores/cart-store';
import { useAsistenCheckout, type PerintahBaru } from '@/stores/asisten-checkout-store';
import type { AksiAsisten, DrafAlamat } from '@/lib/asisten/aksi';

type AksiProduk = Extract<AksiAsisten, { jenis: 'produk' }>;
type Pindah = (href: string) => void;

const kelasKartu = 'rounded-2xl bg-background p-3 ring-1 ring-foreground/10';

function KartuProduk({ aksi }: { aksi: AksiProduk }) {
  const p = aksi.produk;
  const [varianId, setVarianId] = useState<number | null>(aksi.varianId);
  const [ditambah, setDitambah] = useState(false);
  const varian = p.varian.find((v) => v.id === varianId);
  const harga = varian?.price ?? p.price;
  const butuhVarian = p.varian.length > 0 && !varian;
  const tambah = () => {
    if (butuhVarian || !p.stokAda) return;
    const toko = useCartStore.getState();
    toko.tambahItem({ productId: p.id, variantId: varian?.id ?? null, quantity: aksi.jumlah, slug: p.slug, name: p.name, variantName: varian?.name ?? null, image: p.image, price: harga });
    // Laci keranjang tidak dibuka supaya percakapan tetap terlihat.
    toko.tutupKeranjang();
    setDitambah(true);
    toast.success('Ditambahkan ke keranjang');
  };
  return <article className={kelasKartu} aria-label={p.name}>
    <div className="flex gap-3">
      <Link href={`/produk/${p.slug}`} className="relative h-20 w-16 shrink-0 overflow-hidden rounded-xl bg-tile">
        <Image src={p.image || '/placeholder-produk.svg'} alt={p.name} fill sizes="64px" quality={50} className="object-cover" />
      </Link>
      <div className="min-w-0 flex-1">
        <Link href={`/produk/${p.slug}`} className="line-clamp-2 text-sm font-medium leading-snug hover:underline">{p.name}</Link>
        <p className="mt-1 text-sm">
          <span className="font-semibold tabular-nums">{formatRupiah(harga)}</span>
          {p.compareAtPrice && p.compareAtPrice > harga && <s className="ml-1.5 text-xs text-muted-foreground tabular-nums">{formatRupiah(p.compareAtPrice)}</s>}
        </p>
        <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
          {p.reviewCount > 0 && <><Star aria-hidden className="size-3 fill-current" /><span>{p.rating.toFixed(1)} ({p.reviewCount})</span><span aria-hidden>·</span></>}
          <span>{p.isPreorder ? 'Pre-order' : p.stokAda ? 'Tersedia' : 'Stok habis'}</span>
        </p>
      </div>
    </div>
    {p.varian.length > 0 && <fieldset className="mt-3">
      <legend className="mb-1.5 text-xs text-muted-foreground">{p.variantLabel ?? 'Varian'}{butuhVarian && p.stokAda ? ': pilih dulu' : ''}</legend>
      <div className="flex flex-wrap gap-1.5">{p.varian.map((v) => <button key={v.id} type="button" disabled={!v.stokAda || ditambah} aria-pressed={v.id === varianId} onClick={() => setVarianId(v.id)}
        className="min-h-9 min-w-9 rounded-full border border-border px-3 text-xs font-medium transition-colors hover:border-foreground/40 disabled:cursor-not-allowed disabled:opacity-40 disabled:line-through aria-pressed:border-foreground aria-pressed:bg-foreground aria-pressed:text-background">{v.name}</button>)}</div>
    </fieldset>}
    <div className="mt-3 flex items-center gap-2">
      {ditambah
        ? <p role="status" className="flex flex-1 items-center gap-1.5 text-sm font-medium text-green-700 dark:text-green-300"><Check aria-hidden className="size-4" />Ada di keranjang</p>
        : <Button type="button" size="sm" className="flex-1" disabled={!p.stokAda || butuhVarian} onClick={tambah}>
          <Plus aria-hidden />{!p.stokAda ? 'Stok habis' : butuhVarian ? `Pilih ${(p.variantLabel ?? 'varian').toLowerCase()}` : aksi.jumlah > 1 ? `Tambah ${aksi.jumlah} ke Keranjang` : 'Tambah ke Keranjang'}
        </Button>}
      <Button asChild size="sm" variant="outline"><Link href={`/produk/${p.slug}`}>Lihat</Link></Button>
    </div>
  </article>;
}

function TombolCheckout({ pindah }: { pindah: Pindah }) {
  const jumlah = useCartStore((s) => s.items.reduce((n, i) => n + i.quantity, 0));
  const diCheckout = usePathname() === '/checkout';
  if (diCheckout) return <p className="text-sm text-muted-foreground">Anda sudah di halaman checkout. Ikuti langkahnya di halaman ini.</p>;
  return <div className={kelasKartu}>
    <Button type="button" className="w-full" disabled={jumlah === 0} onClick={() => pindah('/checkout')}><ShoppingBag aria-hidden />Lanjut ke Checkout{jumlah > 0 ? ` (${jumlah} barang)` : ''}</Button>
    {jumlah === 0 && <p className="mt-2 text-xs text-muted-foreground">Keranjang masih kosong. Tambahkan produk dulu.</p>}
  </div>;
}

function TombolPilihan({ perintah, ikon: Ikon, judul, label, pindah }: { perintah: PerintahBaru; ikon: typeof Truck; judul: string; label: string; pindah: Pindah }) {
  const kirim = useAsistenCheckout((s) => s.kirim);
  const diCheckout = usePathname() === '/checkout';
  const [dipilih, setDipilih] = useState(false);
  return <div className={`${kelasKartu} flex items-center gap-3`}>
    <span aria-hidden className="flex size-9 shrink-0 items-center justify-center rounded-full bg-tile"><Ikon className="size-4" /></span>
    <div className="min-w-0 flex-1"><p className="text-xs text-muted-foreground">{judul}</p><p className="truncate text-sm font-medium">{label}</p></div>
    <Button type="button" size="sm" variant={dipilih ? 'outline' : 'default'} onClick={() => { kirim(perintah); setDipilih(true); if (!diCheckout) pindah('/checkout'); }}>
      {dipilih ? <><Check aria-hidden />Dipilih</> : diCheckout ? 'Pakai' : 'Pakai di Checkout'}
    </Button>
  </div>;
}

const BARIS_ALAMAT: [keyof DrafAlamat, string][] = [['name', 'Penerima'], ['phone', 'Nomor HP'], ['street', 'Alamat'], ['district', 'Kecamatan'], ['city', 'Kota/Kab.'], ['province', 'Provinsi'], ['postalCode', 'Kode pos']];

function KartuAlamat({ data, kurang, pindah }: { data: DrafAlamat; kurang: string[]; pindah: Pindah }) {
  const kirim = useAsistenCheckout((s) => s.kirim);
  const diCheckout = usePathname() === '/checkout';
  const [dikirim, setDikirim] = useState(false);
  return <div className={kelasKartu}>
    <p className="mb-2 flex items-center gap-2 text-sm font-medium"><MapPin aria-hidden className="size-4" />Draf alamat pengiriman</p>
    <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
      {BARIS_ALAMAT.filter(([k]) => data[k]).map(([k, label]) => <div key={k} className="contents"><dt className="text-muted-foreground">{label}</dt><dd className="min-w-0 break-words">{data[k]}</dd></div>)}
    </dl>
    {kurang.length > 0 && <p className="mt-2 text-xs text-muted-foreground">Belum ada: {kurang.join(', ')}. Lengkapi di formulir.</p>}
    <Button type="button" size="sm" className="mt-3 w-full" variant={dikirim ? 'outline' : 'default'} onClick={() => { kirim({ jenis: 'alamat', data }); setDikirim(true); if (!diCheckout) pindah('/checkout'); }}>
      {dikirim ? <><Check aria-hidden />Formulir terisi, periksa lalu simpan</> : 'Isi Formulir Alamat'}
    </Button>
    <p className="mt-2 text-xs text-muted-foreground">Alamat baru tersimpan setelah Anda menekan Simpan Alamat di checkout.</p>
  </div>;
}

/** Daftar aksi di bawah satu jawaban asisten. `tutupPanel` dipanggil saat pindah halaman di layar kecil. */
export default function AksiAsistenDaftar({ aksi, tutupPanel }: { aksi: AksiAsisten[]; tutupPanel: () => void }) {
  const router = useRouter();
  const pindah: Pindah = (href) => {
    router.push(href);
    if (window.matchMedia('(max-width: 767px)').matches) tutupPanel();
  };
  if (!aksi.length) return null;
  return <div className="max-w-[92%] space-y-2">
    {aksi.map((a, i) => {
      switch (a.jenis) {
        case 'produk': return <KartuProduk key={`p${a.produk.id}`} aksi={a} />;
        case 'checkout': return <TombolCheckout key="checkout" pindah={pindah} />;
        case 'kurir': return <TombolPilihan key="kurir" perintah={{ jenis: 'kurir', kode: a.kode }} ikon={Truck} judul="Kurir" label={a.label} pindah={pindah} />;
        case 'bayar': return <TombolPilihan key="bayar" perintah={{ jenis: 'bayar', kode: a.kode }} ikon={a.kode === 'cod' ? Banknote : CreditCard} judul="Pembayaran" label={a.label} pindah={pindah} />;
        case 'alamat': return <KartuAlamat key={`alamat${i}`} data={a.data} kurang={a.kurang} pindah={pindah} />;
        default: return null;
      }
    })}
  </div>;
}
