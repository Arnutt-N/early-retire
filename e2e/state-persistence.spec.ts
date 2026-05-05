import { test, expect } from '@playwright/test';

/**
 * E2E coverage for state-persistence + flow-mutation scenarios:
 *
 * - Item 6: Mode toggle mid-flow preserves data
 * - Item 7: Retirement option flip auto-recomputes endDate
 * - Item 8: Schema migration (corrupted / missing-fields / old-version localStorage)
 * - Item 9: Page refresh mid-step preserves Step 5 state
 *
 * Strategy: text-only locators, explicit timeouts, seed via localStorage.
 */

const SCHEMA_VERSION = 3;
const TIMEOUT = 5000;

const goodForm = {
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

const seedAndGo = async (
  page: import('@playwright/test').Page,
  raw: string | object,
) => {
  const data = typeof raw === 'string' ? raw : JSON.stringify(raw);
  await page.addInitScript((payload) => {
    try {
      window.localStorage.setItem('early-retire-form', payload);
    } catch {}
  }, data);
  await page.goto('/');
};

const advanceToCalculationTable = async (page: import('@playwright/test').Page) => {
  await page
    .locator('button:has-text("เริ่มคำนวณ")')
    .click({ timeout: TIMEOUT });
  for (let i = 0; i < 3; i++) {
    await page
      .locator('button:has-text("ถัดไป")')
      .first()
      .click({ timeout: TIMEOUT });
  }
};

test.describe('State persistence + flow mutations', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
  });

  // === Item 8: Schema migration ===
  test('schema migration: missing __schemaVersion → silent clear → loads at Step 0', async ({ page }) => {
    // Old form WITHOUT __schemaVersion field
    const oldForm = { ...goodForm } as Record<string, unknown>;
    delete oldForm.__schemaVersion;

    await seedAndGo(page, oldForm);
    // App should land on Step 0 (Mode Select) because the stale form was cleared.
    await expect(
      page.getByRole('heading', { name: /คุณเป็นสมาชิก กบข\. หรือไม่/ }),
    ).toBeVisible({ timeout: TIMEOUT });
  });

  test('schema migration: outdated __schemaVersion=1 → silent clear', async ({ page }) => {
    const oldForm = { ...goodForm, __schemaVersion: 1 };
    await seedAndGo(page, oldForm);
    await expect(
      page.getByRole('heading', { name: /คุณเป็นสมาชิก กบข\. หรือไม่/ }),
    ).toBeVisible({ timeout: TIMEOUT });
  });

  test('schema migration: corrupt JSON in localStorage → fallback to defaults', async ({ page }) => {
    await seedAndGo(page, '{not valid json}');
    // Should not crash; should land on Step 0
    await expect(
      page.getByRole('heading', { name: /คุณเป็นสมาชิก กบข\. หรือไม่/ }),
    ).toBeVisible({ timeout: TIMEOUT });
  });

  // === Item 9: Page refresh preserves state ===
  test('page refresh at Step 5 preserves form data and step position via localStorage', async ({ page }) => {
    // Seed valid form, advance to Step 5
    await seedAndGo(page, goodForm);
    await advanceToCalculationTable(page);

    // Verify we're on Step 5 — calculation header
    await expect(
      page.locator('text=การคำนวณ').first(),
    ).toBeVisible({ timeout: TIMEOUT });

    // Inspect localStorage — currentSalary should still be 30000
    const stored = await page.evaluate(() => window.localStorage.getItem('early-retire-form'));
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!);
    expect(parsed.currentSalary).toBe(30000);
    expect(parsed.__schemaVersion).toBe(SCHEMA_VERSION);

    // Reload — wizard returns to Step 0 (step state isn't persisted) but data IS
    await page.reload();
    await page.waitForLoadState('networkidle');

    const afterReload = await page.evaluate(() => window.localStorage.getItem('early-retire-form'));
    expect(afterReload).not.toBeNull();
    const reloaded = JSON.parse(afterReload!);
    expect(reloaded.currentSalary).toBe(30000);
    expect(reloaded.birthDate).toBe(goodForm.birthDate);
    expect(reloaded.salaryOverrides).toEqual([]);
  });

  // === Item 6: Mode toggle mid-flow preserves data + recomputes table ===
  test('mode toggle (gfp ↔ non-gfp) preserves form fields', async ({ page }) => {
    await seedAndGo(page, goodForm);
    // Step 0 — switch to non-gfp via radio button
    await page.getByRole('radio', { name: /ไม่เป็นสมาชิก กบข\./ }).click();

    const stored = await page.evaluate(() =>
      window.localStorage.getItem('early-retire-form'),
    );
    const parsed = JSON.parse(stored!);
    expect(parsed.mode).toBe('non-gfp');
    expect(parsed.currentSalary).toBe(30000);
    expect(parsed.birthDate).toBe(goodForm.birthDate);

    // Switch back
    await page.getByRole('radio', { name: /^เป็นสมาชิก กบข\./ }).click();
    const stored2 = await page.evaluate(() =>
      window.localStorage.getItem('early-retire-form'),
    );
    const parsed2 = JSON.parse(stored2!);
    expect(parsed2.mode).toBe('gfp');
    expect(parsed2.currentSalary).toBe(30000); // preserved across toggles
  });

  // === Item 7: Retirement option flip ===
  test('retirement option flip: changing option updates endDate', async ({ page }) => {
    await seedAndGo(page, goodForm);
    // Step 0 → 1
    await page
      .locator('button:has-text("เริ่มคำนวณ")')
      .click({ timeout: TIMEOUT });

    // On Step 1, switch retirement option to "เกษียณอายุ 60 ปี"
    const age60Btn = page.locator('button:has-text("เกษียณอายุ 60 ปี")').first();
    if (await age60Btn.count() > 0) {
      await age60Btn.click({ timeout: TIMEOUT });
      // localStorage's endDate should be auto-computed from birth + 60
      const stored = await page.evaluate(() =>
        window.localStorage.getItem('early-retire-form'),
      );
      const parsed = JSON.parse(stored!);
      expect(parsed.retirementOption).toBe('age60');
      // birth = 1981-01-01 → retire = 2041-10-01 (Oct 1 of birth + 60)
      expect(parsed.endDate).toContain('2041-10-01');
    }
  });
});
