'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { BannerKatalog } from '@/lib/katalog-types';

// Carousel memakai scroll-snap bawaan browser: geser mengikuti jari 1:1, lepas dengan momentum,
// bisa dihentikan dan dibalik kapan saja (prinsip "fluid interfaces"), tanpa library animasi.
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

  if (!slides.length) return <section className="flex h-[300px] flex-col justify-center rounded-2xl bg-orange-50 p-8 md:h-[400px]"><h1 className="text-3xl font-bold">Belanja nyaman di TokoKita</h1><p className="mt-3 text-muted-foreground">Pilihan untuk semua kebutuhan harian Anda.</p><Button asChild className="mt-6 w-fit"><Link href="/produk">Mulai Belanja</Link></Button></section>;

  return <section aria-label="Promo pilihan" aria-roledescription="carousel" className="relative overflow-hidden rounded-[2rem] bg-zinc-900">
    <div ref={jalur} className="flex h-[340px] snap-x snap-mandatory overflow-x-auto overscroll-x-contain md:h-[500px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {slides.map((slide, i) => {
        const href = slide.href?.startsWith('/') && !slide.href.startsWith('//') ? slide.href : '/produk';
        const Judul = i === 0 ? 'h1' : 'h2';
        return <div key={slide.id} role="group" aria-roledescription="slide" aria-label={`Promo ${i + 1} dari ${slides.length}`} inert={i !== index} className="relative h-full w-full shrink-0 snap-start">
          <div className="paralaks absolute inset-0"><Image src={slide.image} alt="" fill loading={i === 0 ? 'eager' : 'lazy'} fetchPriority={i === 0 ? 'high' : 'auto'} quality={60} sizes="(max-width: 1279px) 100vw, 1280px" className="object-cover object-right" /></div>
          <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/50 to-black/15 md:from-black/45 md:via-black/20 md:to-transparent" />
          <div className="relative flex h-full max-w-xl flex-col justify-center px-12 pb-8 sm:px-16 md:px-20 lg:max-w-[36rem]">
            <Judul className="hero-masuk text-balance text-4xl font-extrabold leading-[1.02] tracking-tighter text-white sm:text-6xl md:text-7xl">{slide.title}</Judul>
            {slide.subtitle && <p className="hero-masuk mt-4 max-w-xl text-sm leading-relaxed text-white/95 md:text-xl">{slide.subtitle}</p>}
            <Button asChild variant="outline" className="hero-masuk mt-6 h-12 w-fit rounded-full bg-background px-6 text-base text-foreground shadow-lg shadow-black/20"><Link href={href}>{slide.cta || 'Belanja Sekarang'}<ChevronRight className="size-4" /></Link></Button>
          </div>
        </div>;
      })}
    </div>
    {slides.length > 1 && <>
      <Button aria-label="Promo sebelumnya" size="icon" variant="outline" onClick={() => pergi(index - 1)} className="absolute left-1 top-1/2 size-11 -translate-y-1/2 rounded-full bg-background/90 backdrop-blur-md sm:left-3"><ChevronLeft /></Button>
      <Button aria-label="Promo berikutnya" size="icon" variant="outline" onClick={() => pergi(index + 1)} className="absolute right-1 top-1/2 size-11 -translate-y-1/2 rounded-full bg-background/90 backdrop-blur-md sm:right-3"><ChevronRight /></Button>
      <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2">{slides.map((s, i) => <button key={s.id} aria-label={`Tampilkan promo ${i + 1}`} aria-current={index === i} className="flex size-11 items-center justify-center" onClick={() => pergi(i)}><span className={`h-2 rounded-full motion-safe:transition-[width,background-color] motion-safe:duration-300 ${i === index ? 'w-6 bg-white' : 'w-2 bg-white/60'}`} /></button>)}</div>
    </>}
  </section>;
}
