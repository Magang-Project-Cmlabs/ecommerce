/** Jalur merek asli dari katalog. Salinan kedua disembunyikan dari pembaca layar; tanpa gerak jika diminta. */
export function MerekPilihan({ merek }: { merek: string[] }) {
  if (merek.length < 3) return null;
  const jalur = (sembunyi: boolean) => <ul aria-hidden={sembunyi || undefined} className="flex shrink-0 items-center gap-10 pr-10">
    {merek.map((m) => <li key={m} className="whitespace-nowrap text-lg font-semibold tracking-tight text-zinc-500 transition-colors hover:text-orange-700 md:text-xl">{m}</li>)}
  </ul>;
  return <section aria-label="Merek di TokoKita" className="py-8">
    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Merek pilihan</p>
    <div className="jalur-merek-wadah overflow-hidden">
      <div className="jalur-merek flex w-max motion-reduce:w-auto motion-reduce:flex-wrap">{jalur(false)}{jalur(true)}</div>
    </div>
  </section>;
}
