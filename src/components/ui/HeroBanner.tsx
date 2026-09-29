"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { slides } from "@/lib/data";

export default function HeroBanner() {
  const [index, setIndex] = useState(0);
  const prev = () => setIndex((i) => (i === 0 ? slides.length - 1 : i - 1));
  const next = () => setIndex((i) => (i === slides.length - 1 ? 0 : i + 1));

  const slide = slides[index];
  if (!slide) return null;

  return (
    <section className="relative h-[265px] w-full overflow-hidden rounded-2xl">
      <Image
        src={slide.image}
        alt={slide.title}
        fill
        priority
        className="object-cover object-top"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/20 to-transparent" />

      <div className="relative flex h-full flex-col justify-center pl-28 text-white">
        <h1 className="text-[56px] font-extrabold leading-tight">
          {slide.title}
        </h1>
        <p className="max-w-[440px] text-[32px] font-medium leading-[1.15]">
          {slide.subtitle}
        </p>
        <Link
          href={slide.href}
          className="mt-4 inline-flex w-fit items-center gap-3 rounded-full bg-white px-7 py-3 text-lg font-bold text-[#1a1a1a] hover:bg-gray-100"
        >
          {slide.cta}
          <ChevronRight className="h-5 w-5" />
        </Link>
      </div>

      <button
        onClick={prev}
        aria-label="Sebelumnya"
        className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/70 text-white"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      <button
        onClick={next}
        aria-label="Berikutnya"
        className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-gray-500/70 text-white"
      >
        <ChevronRight className="h-6 w-6" />
      </button>

      <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            aria-label={`Slide ${i + 1}`}
            className={`h-2.5 rounded-full transition-all ${i === index ? "w-7 bg-white" : "w-2.5 bg-white/60"}`}
          />
        ))}
      </div>
    </section>
  );
}
