import { requireAdmin } from '@/lib/auth/akses';
import { promoAdmin } from '@/lib/data/admin';
import { hapusPromoAdmin } from '@/actions/admin';
import { formatRupiah, formatTanggalSingkat } from '@/lib/format';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AdminHeading, AdminEmpty, AksiIkon, safeQuery } from '@/components/admin/presentation';
import { PromoAdminForm, AdminMutationButton } from '@/components/admin/forms';
import { ModalAdmin } from '@/components/admin/ModalAdmin';
import { Lencana } from '@/components/pesanan/Lencana';
const datetimeWIB = (date: Date) => new Date(date.getTime() + 7 * 3_600_000).toISOString().slice(0, 16);
export default async function HalamanPromoAdmin({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin('/admin/promo');
  const params = await searchParams;
  const promos = await promoAdmin(); const edit = safeQuery(params.edit); const selected = promos.find((p) => p.code === edit);
  const tambah = safeQuery(params.tambah) === '1';
  const sekarang = new Date();
  return <>
    <AdminHeading title="Kode promo" description="Kelola diskon, periode promo, kuota, dan batas pemakaian pelanggan." action={<AksiIkon href="/admin/promo?tambah=1" label="Tambah promo" jenis="tambah" />} />
    {promos.length ? <div className="overflow-hidden rounded-3xl border border-border"><Table><TableHeader><TableRow><TableHead>Kode promo</TableHead><TableHead>Diskon</TableHead><TableHead>Pemakaian / kuota</TableHead><TableHead>Berakhir</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Tindakan</TableHead></TableRow></TableHeader><TableBody>{promos.map((p) => {
      const status = !p.isActive ? 'Nonaktif' : p.expiresAt < sekarang ? 'Kedaluwarsa' : p.startsAt > sekarang ? 'Terjadwal' : 'Aktif';
      return <TableRow key={p.code}>
        <TableCell><p className="font-medium">{p.code}</p><p className="text-xs text-muted-foreground">{p.description}</p></TableCell>
        <TableCell className="tabular-nums">{p.type === 'PERCENT' ? `${p.value}%` : formatRupiah(p.value)}</TableCell>
        <TableCell className="tabular-nums">{p.usedCount} / {p.quota ?? 'Tanpa batas'}</TableCell>
        <TableCell>{formatTanggalSingkat(p.expiresAt)}</TableCell>
        <TableCell><Lencana nada={status === 'Aktif' ? 'hijau' : status === 'Terjadwal' ? 'biru' : 'netral'}>{status}</Lencana></TableCell>
        <TableCell><div className="flex flex-wrap justify-end gap-2"><AksiIkon href={`/admin/promo?edit=${encodeURIComponent(p.code)}`} label="Edit" jenis="edit" />{p._count.usages === 0 && p.usedCount === 0 && <AdminMutationButton action={hapusPromoAdmin} data={{ code: p.code }} label="Hapus" confirmText={`Hapus kode promo ${p.code}?`} />}</div></TableCell>
      </TableRow>;
    })}</TableBody></Table></div> : <AdminEmpty>Belum ada kode promo. Buat promo pertama untuk pelanggan.</AdminEmpty>}
    {(tambah || selected) && <ModalAdmin key={selected?.code ?? 'baru'} judul={selected ? `Edit promo ${selected.code}` : 'Tambah kode promo'} deskripsi={selected ? 'Kode tidak bisa diubah setelah dibuat.' : 'Waktu mulai dan berakhir memakai WIB.'} kembaliKe="/admin/promo" lebar="lebar">
      <PromoAdminForm key={selected?.code ?? 'new'} promo={selected ? { code: selected.code, description: selected.description, type: selected.type, value: selected.value, minSubtotal: selected.minSubtotal, maxDiscount: selected.maxDiscount, quota: selected.quota, perUserLimit: selected.perUserLimit, startsAt: datetimeWIB(selected.startsAt), expiresAt: datetimeWIB(selected.expiresAt), isActive: selected.isActive } : undefined} />
    </ModalAdmin>}
  </>;
}
