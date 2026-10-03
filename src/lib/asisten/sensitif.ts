// Penyaring data sensitif untuk asisten (D18). Murni dan tanpa impor, dipakai di server (sebelum
// memanggil model) dan di browser (supaya data itu tidak tampil maupun tersimpan di riwayat chat).

const POLA_SENSITIF: [RegExp, string][] = [
  // 12+ digit beruntun (boleh dipisah spasi/strip): nomor kartu, NIK, rekening.
  [/\d(?:[ -]?\d){11,}/, 'nomor kartu, NIK, atau rekening'],
  [/\b(password|kata ?sandi|sandi|passcode|otp|pin|cvv|cvc)\b\s*(saya|ku|aku)?\s*[:=]?\s*\S{4,}/i, 'password, OTP, atau PIN'],
  [/\b(sk|pk|api[_-]?key|secret|token)[_-][A-Za-z0-9_-]{12,}/i, 'kunci rahasia'],
];

/** Kembalikan pesan penolakan bila pesan memuat data sensitif (pesan itu tidak dikirim ke model). */
export function periksaPesanSensitif(teks: string): string | null {
  for (const [pola, jenis] of POLA_SENSITIF) {
    if (pola.test(teks)) return `Demi keamanan, jangan bagikan ${jenis} di sini. Asisten tidak membutuhkannya. Silakan tulis ulang pertanyaan tanpa data tersebut.`;
  }
  return null;
}

/** Samarkan bagian sensitif agar tidak tampil atau tersimpan di riwayat percakapan. */
export function samarkanSensitif(teks: string): string {
  return teks
    .replace(/\d(?:[ -]?\d){11,}/g, '•••• (disamarkan)')
    .replace(/\b(password|kata ?sandi|sandi|passcode|otp|pin|cvv|cvc)(\s*(?:saya|ku|aku)?\s*[:=]?\s*)\S{4,}/gi, '$1$2••••')
    .replace(/\b(sk|pk|api[_-]?key|secret|token)[_-][A-Za-z0-9_-]{12,}/gi, '•••• (disamarkan)');
}
