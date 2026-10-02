'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { BannerKatalog } from '@/lib/katalog-types';

// Hero gaya Apple Store: panel teks bersih + foto besar. Geser memakai scroll-snap bawaan browser
// (mengikuti jari 1:1, momentum, bisa dibalik kapan saja), tanpa library animasi.
export default function HeroBanner({ slides }: { slides: BannerKatalog[] }) {
  const [index, setIndex] = useState(0);
  const jalur = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = jalur.current;
    if (!el) return;
    const baca = () => setIndex(Math.max(0, Math.min(slides.length - 1, Math.round(el.scrollLeft / Math.max(1, el.clientWidth)))));
    el.addEventListener('scroll', baca, { passive: true });
    return () => el.removeEventListener('scroll', baca);
  }, [slides.length]);

  const pergi = useCallback((tujuan: number) => {
    const el = jalur.current;
    if (!el) return;
    const kurangiGerak = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollTo({ left: ((tujuan + slides.length) % slides.length) * el.clientWidth, behavior: kurangiGerak ? 'auto' : 'smooth' });
  }, [slides.length]);

  if (!slides.length) return <section className="flex min-h-[320px] flex-col justify-center rounded-[28px] bg-tile p-10 md:min-h-[400px]"><h1 className="text-4xl font-semibold tracking-[-0.03em]">Belanja nyaman di TokoKita</h1><p className="mt-3 text-lg text-muted-foreground">Pilihan untuk semua kebutuhan harian Anda.</p><Button asChild size="lg" className="mt-6 w-fit"><Link href="/produk">Mulai Belanja</Link></Button></section>;

  return <section aria-label="Promo pilihan" aria-roledescription="carousel" className="relative overflow-hidden rounded-[28px] bg-tile">
    <div ref={jalur} className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {slides.map((slide, i) => {
        const href = slide.href?.startsWith('/') && !slide.href.startsWith('//') ? slide.href : '/produk';
        const Judul = i === 0 ? 'h1' : 'h2';
        return <div key={slide.id} role="group" aria-roledescription="slide" aria-label={`Promo ${i + 1} dari ${slides.length}`} inert={i !== index} className="grid w-full shrink-0 snap-start md:min-h-[500px] md:grid-cols-[1fr_1.05fr]">
          <div className="relative order-2 flex flex-col justify-center px-7 pb-20 pt-8 md:order-1 md:px-14 md:py-16 lg:px-20">
            <Judul className="hero-masuk text-balance text-[2.5rem] font-semibold leading-[1.04] tracking-[-0.035em] text-zinc-900 md:text-6xl lg:text-[4.25rem]">{slide.title}</Judul>
            {slide.subtitle && <p className="hero-masuk mt-4 max-w-md text-lg leading-snug tracking-[-0.01em] text-zinc-600 md:text-xl">{slide.subtitle}</p>}
            <div className="hero-masuk mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
              <Button asChild size="lg"><Link href={href}>{slide.cta || 'Belanja Sekarang'}</Link></Button>
              <Link href="/produk" className="inline-flex min-h-11 items-center gap-0.5 text-base font-medium text-orange-700 underline-offset-4 hover:underline">Lihat semua produk<ChevronRight aria-hidden className="size-4" /></Link>
            </div>
          </div>
          <div className="relative order-1 m-3 aspect-[4/3] overflow-hidden rounded-[22px] bg-white md:order-2 md:m-4 md:aspect-auto">
            <div className="paralaks absolute inset-0"><Image src={slide.image} alt="" fill loading={i === 0 ? 'eager' : 'lazy'} fetchPriority={i === 0 ? 'high' : 'auto'} quality={70} sizes="(max-width: 767px) 100vw, 660px" className="object-cover" /></div>
          </div>
        </div>;
      })}
    </div>
    {slides.length > 1 && <div className="absolute bottom-4 left-7 flex items-center gap-1 md:bottom-6 md:left-14 lg:left-20">
      {slides.map((s, i) => <button key={s.id} aria-label={`Tampilkan promo ${i + 1}`} aria-current={index === i} className="flex size-11 items-center justify-center" onClick={() => pergi(i)}><span className={`h-1.5 rounded-full motion-safe:transition-[width,background-color] motion-safe:duration-300 ${i === index ? 'w-6 bg-zinc-900' : 'w-1.5 bg-zinc-400'}`} /></button>)}
      <Button aria-label="Promo sebelumnya" size="icon" variant="secondary" onClick={() => pergi(index - 1)} className="ml-2"><ChevronLeft /></Button>
      <Button aria-label="Promo berikutnya" size="icon" variant="secondary" onClick={() => pergi(index + 1)}><ChevronRight /></Button>
    </div>}
  </section>;
}
