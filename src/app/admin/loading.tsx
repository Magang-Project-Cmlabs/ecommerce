import { Skeleton } from '@/components/ui/skeleton';
export default function AdminLoading() { return <div className="space-y-6" aria-label="Memuat panel admin"><Skeleton className="h-8 w-56" /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div><Skeleton className="h-80 rounded-xl" /></div>; }
