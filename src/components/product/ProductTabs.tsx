'use client';
import { useEffect, useState } from 'react';
import { Tabs } from '@/components/ui/tabs';
export default function ProductTabs({ children }: { children: React.ReactNode }) {
  const [tab, setTab] = useState('deskripsi');
  useEffect(() => {
    let frame = 0;
    const buka = () => {
      if (window.location.hash === '#ulasan-produk' || window.location.hash === '#ulasan') {
        setTab('ulasan');
        frame = window.requestAnimationFrame(() => document.getElementById('ulasan-produk')?.scrollIntoView({ block: 'start' }));
      }
    };
    buka(); window.addEventListener('hashchange', buka);
    return () => { window.removeEventListener('hashchange', buka); window.cancelAnimationFrame(frame); };
  }, []);
  return <Tabs value={tab} onValueChange={setTab}>{children}</Tabs>;
}
