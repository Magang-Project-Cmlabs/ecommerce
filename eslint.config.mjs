import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Hasil generate & keluaran tes (TokoKita)
    "src/generated/**",
    "coverage/**",
    "tests/e2e/.report/**",
    "tests/e2e/.artifacts/**",
    // Perkakas AI (skrip Node CommonJS), bukan kode aplikasi
    ".claude/**",
  ]),
  {
    rules: {
      // Parameter berawalan _ sengaja tidak dipakai (mis. tanda tangan mock)
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    },
  },
]);

export default eslintConfig;
