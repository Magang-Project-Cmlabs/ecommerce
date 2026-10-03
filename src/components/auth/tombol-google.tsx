// Tombol Login Google (D21). Tautan biasa ke route handler; tampil hanya bila dikonfigurasi.
export function TombolGoogle({ next, label = 'Masuk dengan Google' }: { next: string | null; label?: string }) {
  const href = next ? `/api/auth/google?next=${encodeURIComponent(next)}` : '/api/auth/google';
  return (
    <div className="grid gap-4">
      <div className="text-muted-foreground flex items-center gap-3 text-xs" aria-hidden>
        <span className="h-px flex-1 bg-border" />atau<span className="h-px flex-1 bg-border" />
      </div>
      <a
        href={href}
        className="border-input bg-background hover:bg-muted focus-visible:outline-ring inline-flex h-11 items-center justify-center gap-3 rounded-full border px-4 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        <svg aria-hidden viewBox="0 0 48 48" className="size-5">
          <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
          <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
          <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
          <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
        </svg>
        {label}
      </a>
    </div>
  );
}

/** Pesan galat Login Google untuk /masuk?galat=... */
export const PESAN_GALAT_GOOGLE: Record<string, string> = {
  google: 'Masuk dengan Google gagal. Silakan coba lagi.',
  'google-batal': 'Masuk dengan Google dibatalkan.',
  'google-nonaktif': 'Masuk dengan Google belum tersedia.',
  'google-admin': 'Akun admin masuk memakai email dan password.',
  'google-dihapus': 'Akun dengan email ini sudah dihapus.',
  'google-tertaut-lain': 'Email ini sudah terhubung dengan akun Google lain.',
  'google-sering': 'Terlalu banyak percobaan masuk dengan Google. Coba lagi dalam beberapa menit.',
};
