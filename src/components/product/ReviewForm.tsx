'use client';

import { useState, useTransition, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { kirimUlasan } from '@/actions/katalog';
import { unggahGambar } from '@/actions/upload';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

type Item = { id: number; variantName: string | null; order: { orderNumber: string } };
export default function ReviewForm({ items }: { items: Item[] }) {
  const [error, setError] = useState('');
  const [fields, setFields] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();
  const [uploadStatus, setUploadStatus] = useState('');
  const router = useRouter();
  const form = useRef<HTMLFormElement>(null);
  const sending = useRef(false);
  if (!items.length) return null;

  function kirim(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending || sending.current) return;
    const data = new FormData(e.currentTarget);
    sending.current = true;
    setFields({}); setError('');
    startTransition(async () => {
      try {
        const { ulasanSchema } = await import('@/lib/validations/katalog');
        const hasilValidasi = ulasanSchema.safeParse({ orderItemId: data.get('orderItemId'), rating: data.get('rating'), content: data.get('content') });
        const invalid: Record<string, string> = {};
        if (!hasilValidasi.success) for (const issue of hasilValidasi.error.issues) invalid[String(issue.path[0])] ??= issue.message;
        const foto = data.getAll('foto').filter((f): f is File => f instanceof File && f.size > 0);
        if (foto.length > 3) invalid.foto = 'Maksimal 3 foto.';
        if (foto.some((f) => f.size > 2 * 1024 * 1024 || !['image/jpeg', 'image/png', 'image/webp'].includes(f.type))) invalid.foto = 'Gunakan foto JPG, PNG, atau WebP dengan ukuran maksimal 2 MB.';
        setFields(invalid);
        if (Object.keys(invalid).length) return;
        const tokens: string[] = [];
        data.delete('foto');
        for (const [index, file] of foto.entries()) {
          setUploadStatus(`Mengunggah foto ${index + 1}/${foto.length}…`);
          const upload = new FormData(); upload.set('purpose', 'review'); upload.set('file', file); upload.set('orderItemId', String(data.get('orderItemId')));
          const hasil = await unggahGambar(upload);
          if (!hasil.ok) { setFields({ foto: hasil.message }); return; }
          tokens.push(hasil.token);
        }
        data.set('uploadTokens', JSON.stringify(tokens));
        setUploadStatus('Menyimpan ulasan…');
        const hasil = await kirimUlasan(data);
        if (hasil.success) { toast.success(hasil.message); form.current?.reset(); router.refresh(); }
        else setError(hasil.message);
      } catch { setError('Ulasan belum terkirim. Periksa koneksi lalu coba kembali.'); }
      finally { sending.current = false; setUploadStatus(''); }
    });
  }
  return (
    <form ref={form} noValidate className="mb-6 space-y-4 rounded-xl border p-4" onSubmit={kirim}>
      <h3 className="font-semibold">Tulis Ulasan</h3>
      <p className="text-sm text-muted-foreground">Bagikan pengalaman Anda sebagai pembeli terverifikasi.</p>
      <div>
        <Label htmlFor="pesanan-ulasan">Produk dari pesanan</Label>
        <select id="pesanan-ulasan" name="orderItemId" disabled={pending} aria-invalid={!!fields.orderItemId} aria-describedby={fields.orderItemId ? 'error-pesanan-ulasan' : undefined} className="mt-2 h-11 w-full rounded-lg border bg-background px-3 text-sm">
          {items.map((it) => <option key={it.id} value={it.id}>{it.order.orderNumber}{it.variantName ? ` — ${it.variantName}` : ''}</option>)}
        </select>
        {fields.orderItemId && <p id="error-pesanan-ulasan" className="mt-1 text-sm text-destructive">{fields.orderItemId}</p>}
      </div>
      <div>
        <Label htmlFor="rating-ulasan">Rating</Label>
        <select id="rating-ulasan" name="rating" required disabled={pending} defaultValue="" aria-invalid={!!fields.rating} aria-describedby={fields.rating ? 'error-rating-ulasan' : undefined} className="mt-2 h-11 w-full rounded-lg border bg-background px-3 text-sm">
          <option value="" disabled>Pilih rating</option>
          {[5, 4, 3, 2, 1].map((r) => <option key={r} value={r}>{r} bintang</option>)}
        </select>
        {fields.rating && <p id="error-rating-ulasan" className="mt-1 text-sm text-destructive">{fields.rating}</p>}
      </div>
      <div>
        <Label htmlFor="isi-ulasan">Ulasan Anda</Label>
        <textarea id="isi-ulasan" name="content" required disabled={pending} minLength={10} maxLength={1000} rows={4} aria-invalid={!!fields.content} aria-describedby="petunjuk-isi-ulasan error-isi-ulasan" placeholder="Ceritakan kualitas dan pengalaman memakai produk ini." className="mt-2 w-full rounded-lg border bg-background p-3 text-sm" />
        <p id="petunjuk-isi-ulasan" className="mt-1 text-xs text-muted-foreground">10–1000 karakter.</p>
        <p id="error-isi-ulasan" className="mt-1 text-sm text-destructive">{fields.content}</p>
      </div>
      <div>
        <Label htmlFor="foto-ulasan">Foto produk (opsional)</Label>
        <Input id="foto-ulasan" name="foto" disabled={pending} type="file" multiple accept="image/jpeg,image/png,image/webp" aria-invalid={!!fields.foto} aria-describedby="petunjuk-foto-ulasan error-foto-ulasan" className="mt-2 h-11" />
        <p id="petunjuk-foto-ulasan" className="mt-1 text-xs text-muted-foreground">Maksimal 3 foto JPG, PNG, atau WebP; 2 MB per foto.</p>
        <p id="error-foto-ulasan" className="mt-1 text-sm text-destructive">{fields.foto}</p>
      </div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {uploadStatus && <p role="status" aria-live="polite" className="text-sm text-muted-foreground">{uploadStatus}</p>}
      <Button type="submit" disabled={pending} className="h-11">{pending && <Loader2 className="size-4 animate-spin" />}{pending ? 'Mengirim Ulasan…' : 'Kirim Ulasan'}</Button>
    </form>
  );
}
