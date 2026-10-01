'use server';
import { requireAdmin, requireUser } from '@/lib/auth/akses';
import { unggahGambarSchema } from '@/lib/validations/upload';
import { simpanGambar } from '@/lib/storage';
import { buatTokenGambar } from '@/lib/upload-token';
import { ambilItemUntukUlasan } from '@/lib/data/katalog';
import { bolehMengulas } from '@/lib/pesanan/ulasan';
import { catatBatasAuth } from '@/lib/auth/pembatas-auth';
import { pesanTerlaluSering } from '@/lib/auth/batas-percobaan';

export async function unggahGambar(formData: FormData): Promise<{ ok: true; token: string; url: string } | { ok: false; message: string }> {
  const user = await requireUser('/akun');
  const parsed = unggahGambarSchema.safeParse({ purpose: formData.get('purpose'), orderItemId: formData.get('orderItemId') ?? undefined, files: formData.getAll('file') });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? 'Unggahan tidak valid.' };
  if (parsed.data.purpose !== 'review') await requireAdmin('/admin');
  else {
    try {
      const item = await ambilItemUntukUlasan(parsed.data.orderItemId!, user.id);
      if (!item) return { ok: false, message: 'Item pesanan tidak tersedia untuk foto ulasan.' };
      const alasan = bolehMengulas({ userId: user.id, pemilikId: item.order.userId, status: item.order.status, deliveredAt: item.order.deliveredAt, sudahDiulas: !!item.review });
      if (alasan) return { ok: false, message: alasan };
      const batas = await catatBatasAuth(`upload-review:${user.id}:${item.id}`);
      if (!batas.boleh) return { ok: false, message: pesanTerlaluSering(batas.tungguDetik) };
    } catch {
      console.error('[upload] Izin unggahan belum dapat diperiksa');
      return { ok: false, message: 'Unggahan belum tersedia. Coba lagi beberapa saat.' };
    }
  }
  try {
    const url = await simpanGambar(parsed.data.files[0]!, { minDimension: parsed.data.purpose === 'product' ? 800 : 1 });
    const token = await buatTokenGambar(url, user.id, parsed.data.purpose);
    return { ok: true, token, url };
  } catch (error) {
    console.error('[upload] Gambar belum dapat disimpan');
    return { ok: false, message: error instanceof Error ? error.message : 'Gambar belum dapat disimpan. Coba lagi.' };
  }
}
