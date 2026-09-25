// Pemindaian aksesibilitas otomatis memakai axe-core (target PRD §14: WCAG 2.1 AA).
//
// Hanya pelanggaran tingkat serious dan critical yang menggagalkan tes, supaya
// tes tidak berisik dan tetap dipercaya. Pemindaian otomatis tidak menggantikan
// uji keyboard manual (docs/UJI_MANDIRI.md).

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { HALAMAN_PUBLIK } from '../helpers/pages';

const TINGKAT_DIPERIKSA = ['serious', 'critical'];

type Pelanggaran = { id: string; impact?: string | null; help: string; nodes: unknown[] };

function ringkas(violations: Pelanggaran[]) {
  return violations
    .filter((v) => TINGKAT_DIPERIKSA.includes(v.impact ?? ''))
    .map((v) => `${v.id} (${v.impact}, ${v.nodes.length} elemen): ${v.help}`);
}

test.describe('Aksesibilitas · publik', () => {
  for (const h of HALAMAN_PUBLIK) {
    test(`${h.judul} (${h.path}) bebas pelanggaran serius`, async ({ page }) => {
      test.skip(!!h.belumAda, 'Halaman belum dibangun (tandai di helpers/pages.ts)');

      await page.goto(h.path, { waitUntil: 'load' });
      const hasil = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      expect(ringkas(hasil.violations)).toEqual([]);
    });
  }
});
