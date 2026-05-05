import { test } from '@playwright/test';

/**
 * Performance measurement spec — report-only.
 *
 * Logs paint timings and bundle sizes for each CI run. Without prior
 * baseline data the budgets would be guesswork; instead the test always
 * passes and the values land in Playwright's HTML report
 * (`playwright-report-<browser>` artifact). Establish baselines from a few
 * green runs, then convert to gating thresholds.
 */

test.describe('Performance measurements (report only)', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
  });

  test('landing page paint timings', async ({ page }) => {
    const t0 = Date.now();
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const elapsed = Date.now() - t0;

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

    console.log(
      `[perf] DCL=${elapsed}ms first-paint=${fp?.toFixed(0) ?? 'n/a'}ms first-contentful-paint=${fcp?.toFixed(0) ?? 'n/a'}ms`,
    );
  });

  test('main JS bundle size', async ({ page }) => {
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
    console.log(
      `[perf] /_next/static/*.js: ${transferred.length} files, ${totalKB.toFixed(0)} KB total`,
    );
  });
});
