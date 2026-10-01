import { AdminNavigation } from '@/components/admin/navigation';
import type { Metadata } from 'next';
import type { CSSProperties } from 'react';
export const metadata: Metadata = { robots: { index: false, follow: false } };
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div style={{ '--primary': 'var(--secondary)', '--ring': 'var(--secondary)' } as CSSProperties} className="mx-auto flex w-full max-w-7xl flex-1 flex-col overflow-x-clip lg:flex-row"><AdminNavigation /><main className="min-w-0 flex-1 bg-muted/40 p-4 md:p-7 lg:p-8">{children}</main></div>;
}
