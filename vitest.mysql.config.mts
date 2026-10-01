import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import dotenv from 'dotenv';
dotenv.config({ path: 'tests/e2e/.env.e2e', quiet: true });
export default defineConfig({ test: { include: ['tests/integration/**/*.test.ts'], environment: 'node', fileParallelism: false, testTimeout: 30000, hookTimeout: 30000 }, resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } } });
