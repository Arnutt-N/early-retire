import { test, expect, type Page } from '@playwright/test';

// Boundary tests for the Oct 1 fiscal-year cutoff fix in calculateRetirementDate
// + auto-calc tests for the new "อายุ 50 ปี ขึ้นไป" option using
// calculateAge50EligibilityDate(birth, start) = max(birth+50yrs, start+10yrs)
// + UX assertion that all 4 option pills render label only (no description sub-text).
//
// Tests use the localStorage pre-seed pattern (mirror of smoke.spec.ts:172) for
// scenarios that need pre-populated dates — Playwright `fill()` doesn't reliably
// blur the CalendarPickerTH inputs which only commit onChange in handleBlur.

test.describe('Retirement rules — Oct 1 cutoff + age50 eligibility option', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.addInitScript(() => {
      try {
        window.localStorage.removeItem('early-retire-form');
      } catch {
        // ignore
      }
    });
  });

  // Helper: skip Step 0 by picking non-gfp + clicking "เริ่มคำนวณ"
  const enterStep1 = async (page: Page) => {
    await page.goto('/');
    await page.getByRole('radio', { name: /ไม่เป็นสมาชิก กบข\./ }).click();
    await page.locator('button:has-text("เริ่มคำนวณ")').click();
    await page.waitForTimeout(400);
  };

  // Helper: pre-seed Step 1 dates + retirementOption via localStorage.
  // Schema version mirrors types/index.ts:122 (currently 3). Mode is left
  // unseeded so Step 0's mode-select gate is exercised normally — seeding
  // mode directly proved unreliable on CI's Linux Chromium (hydration race).
  const seedStep1Dates = async (
    page: Page,
    state: {
      birthDate: string;
      startDate: string;
      retirementOption?: 'age60' | 'service25' | 'age50' | 'custom';
    },
  ) => {
    await page.addInitScript((s) => {
      window.localStorage.setItem(
        'early-retire-form',
        JSON.stringify({
          __schemaVersion: 3,
          birthDate: s.birthDate,
          startDate: s.startDate,
          ...(s.retirementOption && { retirementOption: s.retirementOption }),
        }),
      );
    }, state);
  };

  // ─────────────────────────────────────────────────────────────────────
  // Group A — Oct 1 boundary (calculateRetirementDate fix)
  // ─────────────────────────────────────────────────────────────────────

  test('birth 1/10/2510 with age60 option → endDate auto-fills 1/10/2570 (no +1)', async ({ page }) => {
    await enterStep1(page);
    const day = page.locator('[placeholder="วว"]');
    const month = page.locator('[placeholder="ดด"]');
    const year = page.locator('[placeholder="ปปปป (พ.ศ.)"]');

    // Birth date: 1/10/2510 BE
    await day.nth(0).fill('1');
    await month.nth(0).fill('10');
    await year.nth(0).fill('2510');

    // Start date: any valid before end (1/10/2540)
    await day.nth(1).fill('1');
    await month.nth(1).fill('10');
    await year.nth(1).fill('2540');

    // Click "เกษียณอายุ 60 ปี" — auto-fills endDate via calculateRetirementDate
    await page.getByRole('button', { name: /เกษียณอายุ 60 ปี/ }).click();
    await page.waitForTimeout(200);

    // Assert: end year is 2570 (NOT 2571 — the bug). Day/month are zero-padded
    // to width 2 by `partsFrom` in CalendarPickerTH.tsx.
    await expect(day.nth(2)).toHaveValue('01');
    await expect(month.nth(2)).toHaveValue('10');
    await expect(year.nth(2)).toHaveValue('2570');
  });

  test('birth 2/10/2510 with age60 option → endDate = 1/10/2571 (still +1)', async ({ page }) => {
    await enterStep1(page);
    const day = page.locator('[placeholder="วว"]');
    const month = page.locator('[placeholder="ดด"]');
    const year = page.locator('[placeholder="ปปปป (พ.ศ.)"]');

    await day.nth(0).fill('2');
    await month.nth(0).fill('10');
    await year.nth(0).fill('2510');

    await day.nth(1).fill('1');
    await month.nth(1).fill('10');
    await year.nth(1).fill('2540');

    await page.getByRole('button', { name: /เกษียณอายุ 60 ปี/ }).click();
    await page.waitForTimeout(200);

    await expect(year.nth(2)).toHaveValue('2571');
  });

  // ─────────────────────────────────────────────────────────────────────
  // Group B — age50 option auto-calc (calculateAge50EligibilityDate)
  // ─────────────────────────────────────────────────────────────────────

  test('age50 option requires both birthDate and startDate (warns when missing)', async ({ page }) => {
    await enterStep1(page);

    // Click age50 with no dates → amber warning, option not selected
    await page.getByRole('button', { name: /อายุ 50 ปี ขึ้นไป/ }).click();
    await expect(
      page.locator('text=กรุณาเลือกวันเกิดและวันบรรจุก่อน'),
    ).toBeVisible();
  });

  test('age50 example 1: birth 1/1/2524 + start 1/1/2555 → end 1/1/2574 (age-50 anniversary binds)', async ({ page }) => {
    // Pre-seed: birth 1/1/2524 BE = 1/1/1981 CE, start 1/1/2555 BE = 1/1/2012 CE
    // birth + 50 yrs = 1/1/2574 BE (CE 2031), start + 10 yrs = 1/1/2565 BE (CE 2022)
    // max = 1/1/2574 BE — age-50 is later, so it's the binding constraint
    await seedStep1Dates(page, {
      birthDate: '1981-01-01T00:00:00.000Z',
      startDate: '2012-01-01T00:00:00.000Z',
    });
    await enterStep1(page);

    const day = page.locator('[placeholder="วว"]');
    const month = page.locator('[placeholder="ดด"]');
    const year = page.locator('[placeholder="ปปปป (พ.ศ.)"]');

    // Click "อายุ 50 ปี ขึ้นไป" — should auto-fill endDate
    await page.getByRole('button', { name: /อายุ 50 ปี ขึ้นไป/ }).click();
    await page.waitForTimeout(200);

    await expect(day.nth(2)).toHaveValue('01');
    await expect(month.nth(2)).toHaveValue('01');
    await expect(year.nth(2)).toHaveValue('2574');
  });

  test('age50 example 2: birth 1/1/2524 + start 1/1/2565 → end 1/1/2575 (service-10 anniversary binds)', async ({ page }) => {
    // Pre-seed: birth 1/1/2524 BE = 1/1/1981 CE, start 1/1/2565 BE = 1/1/2022 CE
    // birth + 50 yrs = 1/1/2574 BE (CE 2031), start + 10 yrs = 1/1/2575 BE (CE 2032)
    // max = 1/1/2575 BE — service-10 is later, so it's the binding constraint
    await seedStep1Dates(page, {
      birthDate: '1981-01-01T00:00:00.000Z',
      startDate: '2022-01-01T00:00:00.000Z',
    });
    await enterStep1(page);

    const day = page.locator('[placeholder="วว"]');
    const month = page.locator('[placeholder="ดด"]');
    const year = page.locator('[placeholder="ปปปป (พ.ศ.)"]');

    await page.getByRole('button', { name: /อายุ 50 ปี ขึ้นไป/ }).click();
    await page.waitForTimeout(200);

    await expect(day.nth(2)).toHaveValue('01');
    await expect(month.nth(2)).toHaveValue('01');
    await expect(year.nth(2)).toHaveValue('2575');
  });

  test('age50 boundary date passes wizard-level eligibility (no modal blocking ถัดไป)', async ({ page }) => {
    // The auto-calc'd date (example 2: 1/1/2575 BE = 1/1/2032 CE) must satisfy
    // the wizard's eligibility check (service ≥ 10 AND age ≥ 50). After the
    // calendar-precise fix in app/page.tsx, ageInYearsAt the 50th birthday = 50.0
    // exactly (not 49.998 from the old ms/365.25 calc).
    await seedStep1Dates(page, {
      birthDate: '1981-01-01T00:00:00.000Z',
      startDate: '2022-01-01T00:00:00.000Z',
    });
    await enterStep1(page);

    await page.getByRole('button', { name: /อายุ 50 ปี ขึ้นไป/ }).click();
    await page.waitForTimeout(200);

    // ถัดไป enabled (eligibility passes — both lump-sum + monthly)
    await expect(page.locator('button:has-text("ถัดไป")')).toBeEnabled();
  });

  // ─────────────────────────────────────────────────────────────────────
  // Group C — UX cleanup (descriptions stripped from all 4 option pills)
  // ─────────────────────────────────────────────────────────────────────

  test('descriptions are stripped from all 4 option pills', async ({ page }) => {
    await enterStep1(page);

    // The 3 legacy description strings must NOT exist as standalone text nodes.
    // Using `getByText({ exact: true })` matches elements whose full text content
    // equals the value — this excludes the helper-text under the bottom datepicker
    // which contains "คำนวณอัตโนมัติจากวันเกิด" as a SUBSTRING (with extra suffix).
    await expect(
      page.getByText('คำนวณอัตโนมัติจากวันเกิด', { exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByText('คำนวณจากวันบรรจุ + 25 ปี', { exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByText('เลือกวันที่ด้วยตัวเอง', { exact: true }),
    ).toHaveCount(0);

    // All 4 labels are visible. Substring (no `^` anchor) because the age60
    // pill carries a "แนะนำ" badge whose text comes first in the accessible name.
    await expect(
      page.getByRole('button', { name: /เกษียณอายุ 60 ปี/ }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /อายุราชการ 25 ปี/ }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /อายุ 50 ปี ขึ้นไป/ }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /กำหนดเอง/ }),
    ).toBeVisible();
  });
});
