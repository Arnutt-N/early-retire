import { test, expect } from '@playwright/test';

/**
 * Deterministic E2E coverage for the calculation-table banner + bulk reset.
 *
 * Strategy: seed FormState in localStorage (matching FORM_STATE_SCHEMA_VERSION=3),
 * navigate the wizard with simple click-Next steps, then assert UI state via
 * text-only locators with short explicit timeouts. No xpath, no attribute
 * matchers, no waiting on dynamic table rows.
 */

const SCHEMA_VERSION = 3;
const SHORT_TIMEOUT = 5000;

const baseForm = {
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
  salaryOverrides: [] as Array<unknown>,
};

type Form = typeof baseForm;

/**
 * Seed localStorage with the given form, navigate to Step 5 (calculation
 * table) by clicking through the wizard. Each button click has an explicit
 * 5s timeout — no hidden 30s default waits.
 */
const arriveAtCalculationTable = async (
  page: import('@playwright/test').Page,
  form: Form,
) => {
  await page.addInitScript((data) => {
    try {
      window.localStorage.setItem('early-retire-form', JSON.stringify(data));
    } catch {}
  }, form);
  await page.goto('/');

  // Step 0 → 1
  await page
    .locator('button:has-text("เริ่มคำนวณ")')
    .click({ timeout: SHORT_TIMEOUT });

  // Step 1 → 2 → 3 → 4 (Calculation table is at step index 4)
  for (let i = 0; i < 3; i++) {
    await page
      .locator('button:has-text("ถัดไป")')
      .first()
      .click({ timeout: SHORT_TIMEOUT });
  }
};

test.describe('Calculation table — banner contract', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
  });

  test('no overrides → banner is hidden', async ({ page }) => {
    await arriveAtCalculationTable(page, baseForm);
    await expect(page.locator('text=มีแถวที่ปักหมุดค่าไว้')).toHaveCount(0);
  });

  test('seeded override → banner visible with bulk-reset button', async ({ page }) => {
    await arriveAtCalculationTable(page, {
      ...baseForm,
      salaryOverrides: [
        { effectiveDate: null, level: null, percent: 4, oldSalary: null, newSalary: null },
      ],
    });
    await expect(page.locator('text=มีแถวที่ปักหมุดค่าไว้')).toBeVisible({
      timeout: SHORT_TIMEOUT,
    });
    await expect(
      page.locator('button:has-text("ใช้ค่าเฉลี่ยทุกแถว")'),
    ).toBeVisible({ timeout: SHORT_TIMEOUT });
  });

  test('bulk reset clears overrides and hides banner', async ({ page }) => {
    await arriveAtCalculationTable(page, {
      ...baseForm,
      salaryOverrides: [
        { effectiveDate: null, level: null, percent: 4, oldSalary: null, newSalary: null },
      ],
    });
    await expect(page.locator('text=มีแถวที่ปักหมุดค่าไว้')).toBeVisible({
      timeout: SHORT_TIMEOUT,
    });

    await page
      .locator('button:has-text("ใช้ค่าเฉลี่ยทุกแถว")')
      .click({ timeout: SHORT_TIMEOUT });

    await expect(page.locator('text=มีแถวที่ปักหมุดค่าไว้')).toHaveCount(0);
  });
});
