// Pendeteksi pelanggaran aturan review (CONTRIBUTING.md bagian 3).
//
// Paket GitHub Free + repo private tidak mendukung proteksi branch
// (OPEN_DECISIONS D10), jadi aturan tidak bisa DICEGAH. Skrip ini
// MENDETEKSI setelah kejadian, supaya tidak ada pelanggaran yang lolos diam-diam:
//
// - pull_request (closed + merged): PR digabung dengan < MIN_PERSETUJUAN
//   persetujuan dari orang selain penulisnya -> komentar di PR + job gagal.
// - push ke develop/main: commit yang tidak berasal dari PR mana pun
//   (push langsung) atau push paksa -> job gagal.
//
// Dijalankan oleh .github/workflows/aturan-review.yml. Uji lokal:
//   GITHUB_TOKEN=$(gh auth token) GITHUB_REPOSITORY=Magang-Project-Cmlabs/ecommerce \
//   GITHUB_EVENT_NAME=pull_request GITHUB_EVENT_PATH=event.json DRY_RUN=1 \
//   node .github/scripts/cek-aturan-review.mjs

import fs from 'node:fs';

const TANDA = '<!-- aturan-review -->';
const MIN = Number(process.env.MIN_PERSETUJUAN || 2);
const { GITHUB_TOKEN, GITHUB_REPOSITORY, GITHUB_EVENT_NAME, GITHUB_EVENT_PATH } = process.env;
const DRY_RUN = process.env.DRY_RUN === '1';

if (!GITHUB_TOKEN || !GITHUB_REPOSITORY || !GITHUB_EVENT_NAME || !GITHUB_EVENT_PATH) {
  console.error('::error::Variabel GITHUB_TOKEN, GITHUB_REPOSITORY, GITHUB_EVENT_NAME, GITHUB_EVENT_PATH wajib ada');
  process.exit(2);
}

const event = JSON.parse(fs.readFileSync(GITHUB_EVENT_PATH, 'utf8'));

async function api(path, init = {}) {
  const res = await fetch(`https://api.github.com/repos/${GITHUB_REPOSITORY}${path}`, {
    ...init,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      'X-GitHub-Api-Version': '2022-11-28',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
    },
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`GitHub API ${init.method || 'GET'} ${path}: HTTP ${res.status}`);
  return res.status === 204 ? null : res.json();
}

async function semua(path) {
  const hasil = [];
  for (let hal = 1; ; hal++) {
    const bagian = await api(`${path}${path.includes('?') ? '&' : '?'}per_page=100&page=${hal}`);
    hasil.push(...bagian);
    if (bagian.length < 100) return hasil;
  }
}

/** Persetujuan sah: status review TERAKHIR tiap reviewer = APPROVED, bukan penulis PR. */
export function hitungPersetujuan(reviews, penulis) {
  const terakhir = new Map();
  for (const r of reviews) {
    if (!r.user || r.user.login === penulis) continue;
    if (!['APPROVED', 'CHANGES_REQUESTED', 'DISMISSED'].includes(r.state)) continue; // COMMENTED tidak mengubah keputusan
    terakhir.set(r.user.login, r.state);
  }
  return [...terakhir].filter(([, s]) => s === 'APPROVED').map(([login]) => login);
}

async function cekPullRequest() {
  const pr = event.pull_request;
  if (!pr?.merged) {
    console.log('PR ditutup tanpa digabung, tidak diperiksa.');
    return 0;
  }
  const penyetuju = hitungPersetujuan(await semua(`/pulls/${pr.number}/reviews`), pr.user.login);
  const penggabung = pr.merged_by?.login ?? 'tidak diketahui';
  console.log(`PR #${pr.number}: ${penyetuju.length} persetujuan (${penyetuju.join(', ') || '-'}), digabung oleh ${penggabung}.`);
  if (penyetuju.length >= MIN) return 0;

  const pesan =
    `${TANDA}\n**Aturan review dilanggar.** PR ini digabung oleh @${penggabung} dengan ` +
    `${penyetuju.length} dari ${MIN} persetujuan yang diwajibkan (\`CONTRIBUTING.md\` bagian 3).\n\n` +
    `GitHub paket Free tidak bisa mencegah ini (OPEN_DECISIONS D10). Mohon review susulan oleh ketua tim ` +
    `dan satu anggota lain, lalu bahas di rapat pagi.`;
  console.log(`::error::PR #${pr.number} digabung dengan ${penyetuju.length}/${MIN} persetujuan`);

  if (DRY_RUN) {
    console.log('[DRY_RUN] komentar tidak dikirim:\n' + pesan);
  } else {
    const komentar = await semua(`/issues/${pr.number}/comments`);
    if (!komentar.some((k) => k.body?.includes(TANDA))) {
      await api(`/issues/${pr.number}/comments`, { method: 'POST', body: JSON.stringify({ body: pesan }) });
    }
  }
  return 1;
}

async function cekPush() {
  const cabang = (event.ref || '').replace('refs/heads/', '');
  if (event.forced) {
    console.log(`::error::Push paksa (force push) ke ${cabang}. Riwayat bersama mungkin tertimpa.`);
    return 1;
  }
  const sha = event.after;
  if (!sha || /^0+$/.test(sha)) {
    console.log(`Cabang ${cabang} dihapus, tidak diperiksa.`);
    return 0;
  }
  const prs = await api(`/commits/${sha}/pulls`);
  const asal = prs.find((p) => p.merged_at);
  if (asal) {
    console.log(`Commit ${sha.slice(0, 7)} di ${cabang} berasal dari PR #${asal.number}. OK.`);
    return 0;
  }
  console.log(
    `::error::Commit ${sha.slice(0, 7)} masuk ke ${cabang} tanpa Pull Request (push langsung oleh ${event.pusher?.name ?? 'tidak diketahui'}).`,
  );
  return 1;
}

// exitCode, bukan process.exit(): keluar paksa saat koneksi fetch masih
// ditutup membuat Node di Windows crash (assertion UV_HANDLE_CLOSING).
try {
  process.exitCode =
    GITHUB_EVENT_NAME === 'pull_request' ? await cekPullRequest()
    : GITHUB_EVENT_NAME === 'push' ? await cekPush()
    : (console.log(`Event ${GITHUB_EVENT_NAME} tidak diperiksa.`), 0);
} catch (e) {
  console.error(`::error::Pemeriksaan gagal dijalankan: ${e.message}`);
  process.exitCode = 2;
}
