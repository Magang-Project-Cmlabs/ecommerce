'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { BannerKatalog } from '@/lib/katalog-types';

// Hero foto penuh ala template Framer: foto lifestyle besar, judul putih besar di kiri bawah,
// satu tombol pil putih. Geser memakai scroll-snap bawaan browser (mengikuti jari, bisa dibalik).
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

  if (!slides.length) return <section className="flex min-h-[420px] flex-col justify-end rounded-[28px] bg-tile p-8 md:p-14"><h1 className="max-w-3xl text-5xl font-medium leading-[0.98] md:text-7xl">Belanja nyaman di TokoKita</h1><p className="mt-4 text-lg text-muted-foreground">Pilihan untuk semua kebutuhan harian Anda.</p><Button asChild size="lg" className="mt-7 w-fit"><Link href="/produk">Mulai Belanja</Link></Button></section>;

  return <section aria-label="Promo pilihan" aria-roledescription="carousel" className="relative overflow-hidden rounded-[28px] bg-[#111]">
    <div ref={jalur} className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {slides.map((slide, i) => {
        const href = slide.href?.startsWith('/') && !slide.href.startsWith('//') ? slide.href : '/produk';
        const Judul = i === 0 ? 'h1' : 'h2';
        return <div key={slide.id} role="group" aria-roledescription="slide" aria-label={`Promo ${i + 1} dari ${slides.length}`} inert={i !== index} className="relative h-[min(78svh,720px)] min-h-[480px] w-full shrink-0 snap-start overflow-hidden">
          <div className="paralaks absolute inset-0"><Image src={slide.image} alt="" fill loading={i === 0 ? 'eager' : 'lazy'} fetchPriority={i === 0 ? 'high' : 'auto'} quality={75} sizes="(max-width: 1400px) 100vw, 1400px" className="object-cover" /></div>
          <div aria-hidden className="absolute inset-0 bg-[linear-gradient(to_top,rgb(0_0_0/0.72),rgb(0_0_0/0.25)_45%,transparent_70%)] md:bg-[linear-gradient(to_top_right,rgb(0_0_0/0.7),rgb(0_0_0/0.2)_50%,transparent_75%)]" />
          <div className="absolute inset-x-0 bottom-0 px-6 pb-24 text-white md:px-14 md:pb-16 lg:px-16">
            <Judul className="hero-masuk max-w-[14ch] text-balance text-[2.75rem] font-medium leading-[0.98] tracking-[-0.045em] md:text-7xl lg:text-[5.5rem]">{slide.title}</Judul>
            {slide.subtitle && <p className="hero-masuk mt-4 max-w-md text-base leading-snug text-white/85 md:text-lg">{slide.subtitle}</p>}
            <div className="hero-masuk mt-7"><Link href={href} className="group/cta inline-flex h-12 items-center gap-2 rounded-full bg-white pl-6 pr-5 text-[15px] font-medium text-[#0a0a0a] transition-colors hover:bg-white/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white motion-safe:active:scale-[0.97]">{slide.cta || 'Belanja Sekarang'}<ArrowRight aria-hidden className="size-4 motion-safe:transition-transform motion-safe:group-hover/cta:translate-x-0.5" /></Link></div>
          </div>
        </div>;
      })}
    </div>
    {slides.length > 1 && <div className="absolute bottom-5 right-4 flex items-center gap-1 md:bottom-8 md:right-8">
      {slides.map((s, i) => <button key={s.id} aria-label={`Tampilkan promo ${i + 1}`} aria-current={index === i} className="group/titik flex size-11 items-center justify-center" onClick={() => pergi(i)}><span className={`h-[3px] rounded-full motion-safe:transition-[width,background-color] motion-safe:duration-300 ${i === index ? 'w-8 bg-white' : 'w-4 bg-white/45 group-hover/titik:bg-white/70'}`} /></button>)}
      <button aria-label="Promo sebelumnya" onClick={() => pergi(index - 1)} className="ml-2 flex size-11 items-center justify-center rounded-full bg-white/15 text-white ring-1 ring-white/20 backdrop-blur-md transition-colors hover:bg-white/25 focus-visible:outline-2 focus-visible:outline-white"><ChevronLeft aria-hidden className="size-5" /></button>
      <button aria-label="Promo berikutnya" onClick={() => pergi(index + 1)} className="flex size-11 items-center justify-center rounded-full bg-white/15 text-white ring-1 ring-white/20 backdrop-blur-md transition-colors hover:bg-white/25 focus-visible:outline-2 focus-visible:outline-white"><ChevronRight aria-hidden className="size-5" /></button>
    </div>}
  </section>;
}
