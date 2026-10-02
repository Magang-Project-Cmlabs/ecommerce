'use client';
import { useSyncExternalStore } from 'react';
import { Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';

// Tema disimpan di localStorage('tema') dan dipasang sebagai kelas `dark` pada <html>
// oleh skrip kecil di <head> (lihat SKRIP_TEMA) sebelum halaman tampil, jadi tidak berkedip.
export const SKRIP_TEMA = `try{var t=localStorage.getItem('tema');var d=t?t==='gelap':matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.toggle('dark',d);document.documentElement.style.colorScheme=d?'dark':'light'}catch(e){}`;

function langganan(ubah: () => void) {
  const pengamat = new MutationObserver(ubah);
  pengamat.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  return () => pengamat.disconnect();
}

/** true bila mode gelap aktif. Di server selalu false (ikon ditentukan CSS, jadi tidak berkedip). */
export function useTemaGelap() {
  return useSyncExternalStore(langganan, () => document.documentElement.classList.contains('dark'), () => false);
}

export function pasangTema(gelap: boolean) {
  document.documentElement.classList.toggle('dark', gelap);
  document.documentElement.style.colorScheme = gelap ? 'dark' : 'light';
  try { localStorage.setItem('tema', gelap ? 'gelap' : 'terang'); } catch { /* mode privat: tetap berlaku untuk sesi ini */ }
}

export default function TemaToggle({ className }: { className?: string }) {
  const gelap = useTemaGelap();
  return <button type="button" onClick={() => pasangTema(!document.documentElement.classList.contains('dark'))} aria-pressed={gelap} title="Mode gelap"
    className={cn('relative flex size-11 items-center justify-center rounded-full text-foreground transition-colors hover:bg-foreground/[0.06] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring', className)}>
    <span className="sr-only">Mode gelap</span>
    <Moon aria-hidden className="size-[20px] dark:hidden" strokeWidth={1.6} />
    <Sun aria-hidden className="hidden size-[20px] dark:block" strokeWidth={1.6} />
  </button>;
}
