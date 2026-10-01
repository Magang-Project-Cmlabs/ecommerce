import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Unit test hanya di src/. Tes E2E Playwright (tests/e2e/) dijalankan lewat
// `npm run e2e`, bukan Vitest.
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
});
