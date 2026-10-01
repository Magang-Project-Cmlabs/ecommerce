'use client';

import { usePathname } from 'next/navigation';

// Header dan footer toko tidak ditampilkan di panel admin: admin punya bilah atas sendiri.
export default function SembunyiDiAdmin({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  return path === '/admin' || path?.startsWith('/admin/') ? null : <>{children}</>;
}
