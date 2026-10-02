'use client';
import { useState } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { Expand } from 'lucide-react';
const ProductLightbox = dynamic(() => import('./ProductLightbox'));
export default function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const [index, setIndex] = useState(0); const [open, setOpen] = useState(false);
  const foto = images.length ? images : ['/placeholder-produk.svg'];
  return <div><button onClick={() => setOpen(true)} aria-label={`Perbesar foto ${name}`} className="relative block aspect-square w-full overflow-hidden rounded-3xl bg-tile"><Image src={foto[index] || '/placeholder-produk.svg'} alt={`${name}, foto ${index + 1}`} fill quality={50} loading="eager" fetchPriority="high" sizes="(max-width: 767px) 100vw, 50vw" className="object-cover" /><span className="absolute bottom-3 right-3 flex items-center gap-2 rounded-full bg-background px-3 py-2 text-xs"><Expand className="size-4" />Perbesar</span></button><div className="mt-3 grid grid-cols-4 gap-3">{foto.map((src, i) => <button key={`${src}-${i}`} onClick={() => setIndex(i)} aria-label={`Lihat foto ${i + 1} ${name}`} aria-pressed={index === i} className={`relative aspect-square overflow-hidden rounded-lg border-2 bg-muted ${index === i ? 'border-primary' : 'border-transparent'}`}><Image src={src} alt={`${name}, foto ${i + 1}`} fill sizes="(max-width: 767px) 25vw, 12vw" className="object-cover" /></button>)}</div>{open && <ProductLightbox images={foto} name={name} index={index} close={() => setOpen(false)} />}</div>;
}
