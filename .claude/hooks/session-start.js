#!/usr/bin/env node
// SessionStart hook tingkat PROJECT - READ ONLY.
// Tidak install dependency, tidak mengubah file, tidak menjalankan test,
// tidak melakukan network request, tidak mengubah git state.
// Gagal diam-diam: hook tidak boleh pernah memblokir sesi.
//
// Kalau hook global (~/.claude/hooks/session-start.js) aktif, hook ini hanya
// mencetak bagian khusus project supaya banner tidak dobel. Kalau global tidak
// ada (mesin anggota tim lain), hook ini mencetak banner penuh sendiri.

var fs = require('fs');
var path = require('path');
var cp = require('child_process');

function sh(cmd, cwd) {
  try {
    return cp.execSync(cmd, { cwd: cwd, stdio: ['ignore', 'pipe', 'ignore'], timeout: 3000, encoding: 'utf8' }).trim();
  } catch (e) { return ''; }
}
function has(p) { try { return fs.existsSync(p); } catch (e) { return false; } }
function readJson(p) { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) { return null; } }
function count(dir) { try { return fs.readdirSync(dir).length; } catch (e) { return 0; } }

try {
  var root = process.env.CLAUDE_PROJECT_DIR || process.cwd();
  var home = process.env.USERPROFILE || process.env.HOME || '';
  var out = [];

  // Hook global aktif? (file ada DAN terdaftar di settings global)
  var globalActive = false;
  if (home) {
    var gs = readJson(path.join(home, '.claude', 'settings.json'));
    globalActive = has(path.join(home, '.claude', 'hooks', 'session-start.js')) &&
      !!(gs && gs.hooks && gs.hooks.SessionStart);
  }

  // package.json bisa ada sebelum scaffold (perkakas test modul pembayaran),
  // jadi tanda scaffold adalah dependency `next`, bukan keberadaan berkasnya.
  var pkg = readJson(path.join(root, 'package.json'));
  var deps = pkg ? Object.assign({}, pkg.dependencies || {}, pkg.devDependencies || {}) : {};
  var scaffolded = !!deps.next;
  var scripts = pkg && pkg.scripts ? Object.keys(pkg.scripts) : [];

  if (!globalActive) {
    var branch = sh('git --no-optional-locks rev-parse --abbrev-ref HEAD', root);
    var dirty = branch ? sh('git --no-optional-locks status --porcelain', root) : '';
    out.push('AI Software Development Workflow Active.');
    out.push('');
    out.push('Architecture first.');
    out.push('Use relevant skills only.');
    out.push('Verify before completion.');
    out.push('Do not assume unavailable tools.');
    out.push('');
    out.push('Project : TokoKita (' + root + ')');
    if (branch) out.push('Git     : ' + branch + ' (' + (dirty ? dirty.split('\n').filter(Boolean).length : 0) + ' file berubah)');
    out.push('');
  }

  // --- bagian khusus project ---
  out.push('TokoKita : ' + count(path.join(root, '.claude', 'skills')) + ' skill + ' +
    count(path.join(root, '.claude', 'agents')) + ' agent tingkat project di .claude/');
  out.push('Stack    : Next.js App Router + TS, Prisma, MySQL, Tailwind, shadcn/ui (PRD §5)');
  if (!scaffolded) {
    out.push('Kondisi  : Next.js BELUM di-scaffold. Lihat docs/runbooks/local-setup.md');
    out.push('           bagian A sebelum menulis kode aplikasi.');
  }
  var wajib = ['typecheck', 'lint', 'test', 'build', 'e2e'];
  var kurang = wajib.filter(function (s) { return scripts.indexOf(s) === -1; });
  if (kurang.length) out.push('Skrip    : belum ada ' + kurang.join(', ') + ' -> laporkan NOT_RUN, jangan PASS');
  out.push('Rute     : db/migration/seed -> database-agent | action/auth/cron -> backend-engineer |');
  out.push('           UI -> skill tokokita-ui + frontend-shadcn | stok/promo/ongkir -> tokokita-pesanan |');
  out.push('           bukti -> qa-engineer | sebelum merge -> security-reviewer.');
  out.push('Baca     : docs/MULAI_DI_SINI.md dan docs/PROJECT_STATUS.md sebelum mulai.');
  out.push('Keras    : harga dari server - uang INT - stok bersyarat dalam transaksi -');
  out.push('           authz di setiap action - skema hanya lewat migration - PR ke develop.');
  if (!globalActive) out.push('Status verifikasi hanya boleh PASS, FAIL, atau NOT_RUN.');

  process.stdout.write(out.join('\n') + '\n');
} catch (e) {
  // diam - jangan pernah memblokir sesi
}
process.exit(0);
