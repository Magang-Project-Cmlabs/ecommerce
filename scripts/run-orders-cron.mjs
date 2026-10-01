// Node22+, dijadwalkan setiap15menit. Rahasia dibaca dari .env, bukan crontab.
const secret = process.env.CRON_SECRET;
const base = process.env.APP_URL;
if (!secret || !base) throw new Error('APP_URL dan CRON_SECRET wajib dikonfigurasi.');
const response = await fetch(new URL('/api/cron/orders', base), {
  headers: { Authorization: `Bearer ${secret}` }, signal: AbortSignal.timeout(55000),
});
if (!response.ok) throw new Error(`Cron pesanan gagal: HTTP ${response.status}`);
const result = await response.json();
console.log(JSON.stringify({ waktu: new Date().toISOString(), ...result }));
if (result.failed > 0) process.exitCode = 1;
