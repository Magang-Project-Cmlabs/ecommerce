// Tampilan di ponsel 360 px (PRD §14): tidak ada gulir mendatar dan tombol
// cukup besar untuk disentuh. Hanya dijalankan oleh project `mobile`.

import { test, expect } from '@playwright/test';
import { HALAMAN_PUBLIK } from '../helpers/pages';

const TARGET_SENTUH_MIN = 44; // px, DESIGN.md §3

test.describe('Responsif · 360 px', () => {
  for (const h of HALAMAN_PUBLIK) {
    test(`${h.judul} (${h.path}) tidak melebar dan tombol mudah disentuh`, async ({ page }) => {
      test.skip(!!h.belumAda, 'Halaman belum dibangun (tandai di helpers/pages.ts)');

      await page.goto(h.path, { waitUntil: 'load' });

      const lebar = await page.evaluate(() => ({
        scroll: document.documentElement.scrollWidth,
        client: document.documentElement.clientWidth,
      }));
      expect(lebar.scroll, 'halaman bisa digulir ke samping').toBeLessThanOrEqual(lebar.client + 1);

      const kekecilan = await page.evaluate((min) => {
        return Array.from(document.querySelectorAll<HTMLElement>('button, [role="button"]'))
          .filter((el) => el.offsetParent !== null)
          .map((el) => ({ el, r: el.getBoundingClientRect() }))
          .filter(({ r }) => r.width > 0 && (r.width < min || r.height < min))
          .map(({ el, r }) => `${el.getAttribute('aria-label') || el.textContent?.trim() || el.tagName} (${Math.round(r.width)}×${Math.round(r.height)})`);
      }, TARGET_SENTUH_MIN);
      expect(kekecilan, 'tombol lebih kecil dari 44×44 px').toEqual([]);
    });
  }
});
