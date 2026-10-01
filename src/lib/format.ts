// Format mata uang dan tanggal resmi TokoKita (GLOSSARY.md §6).

export const formatRupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);

/**
 * Format tanggal resmi: 23 Sep 2026, 14.30 WIB (GLOSSARY.md §6).
 */
export function formatTanggalWIB(d: Date | string | number | null | undefined): string {
  if (!d) return "-";
  const date = typeof d === "string" || typeof d === "number" ? new Date(d) : d;
  if (isNaN(date.getTime())) return "-";

  const tgl = new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(date);

  const jam = new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Jakarta",
  }).format(date).replace(":", ".");

  return `${tgl}, ${jam} WIB`;
}

/**
 * Format tanggal singkat: 23 Sep 2026
 */
export function formatTanggalSingkat(d: Date | string | number | null | undefined): string {
  if (!d) return "-";
  const date = typeof d === "string" || typeof d === "number" ? new Date(d) : d;
  if (isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(date);
}
