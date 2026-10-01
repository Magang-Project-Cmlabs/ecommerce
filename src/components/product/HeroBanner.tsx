'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { BannerKatalog } from '@/lib/katalog-types';

export default function HeroBanner({ slides }: { slides: BannerKatalog[] }) {
  const [index, setIndex] = useState(0);
  const slide = slides[index];
  if (!slide) return <section className="flex h-[300px] flex-col justify-center rounded-2xl bg-orange-50 p-8 md:h-[400px]"><h1 className="text-3xl font-bold">Belanja nyaman di TokoKita</h1><p className="mt-3 text-muted-foreground">Pilihan untuk semua kebutuhan harian Anda.</p><Button asChild className="mt-6 w-fit"><Link href="/produk">Mulai Belanja</Link></Button></section>;
  const href = slide.href?.startsWith('/') && !slide.href.startsWith('//') ? slide.href : '/produk';
  return <section aria-label="Promo pilihan" aria-roledescription="carousel" className="relative h-[300px] overflow-hidden rounded-2xl bg-zinc-900 md:h-[400px]">
    <Image src={slide.image} alt="" fill loading="eager" fetchPriority="high" quality={50} sizes="(max-width: 1279px) 100vw, 1280px" className="object-cover" />
    <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
    <div className="relative flex h-full max-w-2xl flex-col justify-center px-12 pb-8 sm:px-16 md:px-20">
      <h1 className="text-balance text-3xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-5xl md:text-6xl">{slide.title}</h1>
      {slide.subtitle && <p className="mt-3 text-sm leading-relaxed text-white md:text-xl">{slide.subtitle}</p>}
      <Button asChild variant="outline" className="mt-5 h-11 w-fit rounded-full bg-background text-foreground"><Link href={href}>{slide.cta || 'Belanja Sekarang'}<ChevronRight className="size-4" /></Link></Button>
    </div>
    {slides.length > 1 && <><Button aria-label="Promo sebelumnya" size="icon" variant="outline" onClick={() => setIndex((i) => (i - 1 + slides.length) % slides.length)} className="absolute left-1 top-1/2 size-11 -translate-y-1/2 rounded-full bg-background/95 sm:left-3"><ChevronLeft /></Button><Button aria-label="Promo berikutnya" size="icon" variant="outline" onClick={() => setIndex((i) => (i + 1) % slides.length)} className="absolute right-1 top-1/2 size-11 -translate-y-1/2 rounded-full bg-background/95 sm:right-3"><ChevronRight /></Button><div className="absolute bottom-2 left-1/2 flex -translate-x-1/2">{slides.map((s, i) => <button key={s.id} aria-label={`Tampilkan promo ${i + 1}`} aria-current={index === i} className="flex size-11 items-center justify-center" onClick={() => setIndex(i)}><span className={`h-2 rounded-full ${i === index ? 'w-6 bg-white' : 'w-2 bg-white/60'}`} /></button>)}</div></>}
  </section>;
}
