import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Accessibility audit using axe-core. Each step in the wizard is checked
 * against WCAG 2.1 AA rules. Violations fail the test so a11y regressions
 * are caught in CI alongside functional tests.
 */

const SCHEMA_VERSION = 3;
const TIMEOUT = 5000;

const seedForm = {
  __schemaVersion: SCHEMA_VERSION,
  mode: 'gfp' as const,
  birthDate: '1981-01-01T00:00:00.000Z',
  startDate: '2012-06-01T00:00:00.000Z',
  endDate: '2041-10-01T00:00:00.000Z',
  retirementOption: 'custom' as const,
  sickLeaveDays: 0,
  personalLeaveDays: 0,
  vacationDays: 0,
  multiplierPeriods: [],
  defaultLevel: 'ชำนาญการ',
  currentSalary: 30000,
  latestAssessmentDate: '2025-10-01T00:00:00.000Z',
  increases: [2, 2, 2, 2, 2, 2],
  salaryOverrides: [],
};

const seedAndAdvance = async (
  page: import('@playwright/test').Page,
  steps: number,
) => {
  await page.addInitScript((data) => {
    try {
      window.localStorage.setItem('early-retire-form', JSON.stringify(data));
    } catch {}
  }, seedForm);
  await page.goto('/');
  if (steps >= 1) {
    await page
      .locator('button:has-text("เริ่มคำนวณ")')
      .click({ timeout: TIMEOUT });
  }
  for (let i = 1; i < steps; i++) {
    await page
      .locator('button:has-text("ถัดไป")')
      .first()
      .click({ timeout: TIMEOUT });
  }
};

const runAxe = async (page: import('@playwright/test').Page) => {
  return await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
};

/**
 * Fail only on critical / serious violations. moderate / minor are logged
 * but don't break CI — they should be tracked for incremental improvement
 * but blocking every release on them is too strict for a first audit pass.
 */
const blockingViolations = (results: { violations: Array<{ id: string; impact?: string | null; description: string; nodes: Array<{ html: string }> }> }) => {
  const all = results.violations;
  const blocking = all.filter(
    (v) => v.impact === 'critical' || v.impact === 'serious',
  );
  const nonBlocking = all.filter(
    (v) => v.impact !== 'critical' && v.impact !== 'serious',
  );
  if (nonBlocking.length > 0) {
    console.log(
      `[a11y] ${nonBlocking.length} non-blocking violations (moderate / minor):`,
      nonBlocking.map((v) => `${v.id} (${v.impact})`).join(', '),
    );
  }
  return blocking;
};

test.describe('Accessibility (axe-core, WCAG 2.1 AA)', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
  });

  test('Step 0 — Mode select', async ({ page }) => {
    await seedAndAdvance(page, 0);
    const r = await runAxe(page);
    const blocking = blockingViolations(r);
    expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);
  });

  test('Step 1 — Personal info', async ({ page }) => {
    await seedAndAdvance(page, 1);
    const r = await runAxe(page);
    const blocking = blockingViolations(r);
    expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);
  });

  test('Step 2 — Service period', async ({ page }) => {
    await seedAndAdvance(page, 2);
    const r = await runAxe(page);
    const blocking = blockingViolations(r);
    expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);
  });

  test('Step 3 — Salary history', async ({ page }) => {
    await seedAndAdvance(page, 3);
    const r = await runAxe(page);
    const blocking = blockingViolations(r);
    expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);
  });

  test('Step 4 — Calculation table', async ({ page }) => {
    await seedAndAdvance(page, 4);
    const r = await runAxe(page);
    const blocking = blockingViolations(r);
    expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);
  });
});
