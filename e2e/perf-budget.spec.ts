import { test, expect } from '@playwright/test';

/**
 * Performance budget tests — fail when key user-perceived metrics regress
 * past sane thresholds. Uses Playwright's built-in PerformanceObserver via
 * page.evaluate() rather than a heavyweight Lighthouse run, so it stays
 * fast and runs alongside the rest of the e2e suite on every PR.
 *
 * Thresholds are intentionally loose to match the project's calm-fintech
 * design (heavy framer-motion, full Tailwind v4 reset). Tighten as builds
 * shrink.
 */

const BUDGETS = {
  // Time to first paint should be under 2s on a fresh page load
  firstPaintMs: 2000,
  // First contentful paint under 2.5s
  fcpMs: 2500,
  // DOM content loaded under 3s
  domContentLoadedMs: 3000,
};

test.describe('Performance budget', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
  });

  test('landing page paints within budget', async ({ page }) => {
    const t0 = Date.now();
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const elapsed = Date.now() - t0;

    expect(
      elapsed,
      `domcontentloaded took ${elapsed}ms — budget ${BUDGETS.domContentLoadedMs}ms`,
    ).toBeLessThan(BUDGETS.domContentLoadedMs);

    // PerformanceObserver via page.evaluate
    const paintMetrics = await page.evaluate(() => {
      const entries = performance.getEntriesByType('paint');
      return entries.reduce(
        (acc, e) => {
          acc[e.name] = e.startTime;
          return acc;
        },
        {} as Record<string, number>,
      );
    });

    const fp = paintMetrics['first-paint'];
    const fcp = paintMetrics['first-contentful-paint'];
    if (typeof fp === 'number') {
      expect(
        fp,
        `first-paint=${fp.toFixed(0)}ms — budget ${BUDGETS.firstPaintMs}ms`,
      ).toBeLessThan(BUDGETS.firstPaintMs);
    }
    if (typeof fcp === 'number') {
      expect(
        fcp,
        `first-contentful-paint=${fcp.toFixed(0)}ms — budget ${BUDGETS.fcpMs}ms`,
      ).toBeLessThan(BUDGETS.fcpMs);
    }

    console.log(
      `[perf] DCL=${elapsed}ms first-paint=${fp?.toFixed(0) ?? 'n/a'}ms first-contentful-paint=${fcp?.toFixed(0) ?? 'n/a'}ms`,
    );
  });

  test('main bundle stays small (gzipped)', async ({ page }) => {
    // Track total transferred bytes for the main page navigation. Loose
    // budget — Next.js + Tailwind v4 is naturally heavier than vanilla.
    const transferred: number[] = [];
    page.on('response', async (resp) => {
      const url = resp.url();
      if (url.includes('/_next/static/') && url.endsWith('.js')) {
        try {
          const buf = await resp.body();
          transferred.push(buf.length);
        } catch {
          // ignore
        }
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const totalKB = transferred.reduce((a, b) => a + b, 0) / 1024;
    console.log(`[perf] /_next/static/*.js total ${totalKB.toFixed(0)} KB`);
    // 1500 KB is generous for a Next.js + framer-motion + Tailwind v4 app
    expect(totalKB, `JS bundles total ${totalKB.toFixed(0)} KB`).toBeLessThan(1500);
  });
});
