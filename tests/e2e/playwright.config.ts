// Konfigurasi Playwright untuk TokoKita.
//
// Kalau E2E_BASE_URL tidak diisi, Playwright menyalakan `npm run dev` sendiri
// (atau memakai server yang sudah menyala di port 3000). Browser memakai Chrome
// yang sudah terpasang (channel 'chrome') supaya tidak perlu mengunduh browser.

import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';
import { loadEnv } from './helpers/env';

loadEnv();

const PORT = Number(process.env.E2E_PORT || 3000);
const BASE_URL = process.env.E2E_BASE_URL || `http://localhost:${PORT}`;
const pakaiServerSendiri = !process.env.E2E_BASE_URL;
const lintasBrowser = process.env.E2E_CROSS_BROWSER === '1';
const abaikanSandbox = [
  ...(process.env.E2E_MIDTRANS_SANDBOX === '1' ? [] : [/payment-sandbox\.spec\.ts/]),
  // Latihan demo PPT: lambat dan menulis data; hanya saat diminta.
  ...(process.env.E2E_DEMO === '1' ? [] : [/demo-ppt\.spec\.ts/]),
];

export default defineConfig({
  testDir: path.join(__dirname, 'specs'),
  // Playwright membersihkan outputDir; bukti manual dan log MySQL di folder
  // induk harus tetap tersedia, terutama karena Windows mengunci log aktif.
  outputDir: path.join(__dirname, '.artifacts', 'playwright'),
  // Dev server Next.js mengompilasi halaman saat pertama dibuka, jadi longgar.
  timeout: 60 * 1000,
  expect: { timeout: 10 * 1000 },
  // Satu database bersama: tes yang menulis data bisa saling mengganggu.
  workers: process.env.CI || lintasBrowser ? 1 : 2,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { outputFolder: path.join(__dirname, '.report'), open: 'never' }]],
  use: {
    baseURL: BASE_URL,
    locale: 'id-ID',
    timezoneId: 'Asia/Jakarta',
    screenshot: 'only-on-failure',
    // Trace sudah memuat tangkapan layar tiap aksi. Video butuh ffmpeg terpisah;
    // nyalakan dengan E2E_VIDEO=1 setelah `npx playwright install ffmpeg`.
    video: process.env.E2E_VIDEO ? 'retain-on-failure' : 'off',
    trace: 'retain-on-failure',
  },
  webServer: pakaiServerSendiri
    ? {
        command: 'npm run dev',
        cwd: path.join(__dirname, '..', '..'),
        url: BASE_URL,
        reuseExistingServer: true,
        timeout: 120 * 1000,
      }
    : undefined,
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], channel: 'chrome', viewport: { width: 1440, height: 900 } },
      testIgnore: [/responsive\.spec\.ts/, ...abaikanSandbox],
    },
    {
      // Emulasi ponsel lengkap (pointer: coarse, touch), bukan sekadar lebar layar.
      name: 'mobile',
      use: { ...devices['Pixel 5'], channel: 'chrome', viewport: { width: 360, height: 780 } },
      testMatch: /responsive\.spec\.ts/,
    },
    ...(lintasBrowser ? [
      {
        name: 'edge',
        use: { ...devices['Desktop Edge'], channel: 'msedge', viewport: { width: 1440, height: 900 } },
        testIgnore: [/responsive\.spec\.ts/, ...abaikanSandbox],
      },
      {
        name: 'firefox',
        use: { ...devices['Desktop Firefox'], channel: undefined, viewport: { width: 1440, height: 900 } },
        testIgnore: [/responsive\.spec\.ts/, ...abaikanSandbox],
      },
      {
        name: 'webkit',
        use: { ...devices['Desktop Safari'], channel: undefined, viewport: { width: 1440, height: 900 } },
        testIgnore: [/responsive\.spec\.ts/, ...abaikanSandbox],
      },
      {
        name: 'mobile-webkit',
        use: { ...devices['iPhone 13'], channel: undefined, viewport: { width: 360, height: 780 } },
        testMatch: /responsive\.spec\.ts/,
      },
    ] : []),
  ],
});
