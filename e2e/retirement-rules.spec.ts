import { test, expect, type Page } from '@playwright/test';

// Boundary tests for the Oct 1 fiscal-year cutoff fix in calculateRetirementDate
// + happy/warn paths for the new "อายุตัว 50 ปี" Step 2 option
// + UX assertion that all 4 option pills render label only (no description sub-text).
//
// Ref: .claude/PRPs/plans/retirement-options-age50-and-oct1-fix.plan.md

test.describe('Retirement rules — Oct 1 cutoff + age50 option', () => {
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

  test('birth 1/10/2510 with age60 option → endDate auto-fills 1/10/2570 (no +1)', async ({ page }) => {
    await enterStep1(page);
    const day = page.locator('[placeholder="วว"]');
    const month = page.locator('[placeholder="ดด"]');
    const year = page.locator('[placeholder="ปปปป (พ.ศ.)"]');

    // Birth date: 1/10/2510
    await day.nth(0).fill('1');
    await month.nth(0).fill('10');
    await year.nth(0).fill('2510');

    // Start date: any valid before end (1/10/2540)
    await day.nth(1).fill('1');
    await month.nth(1).fill('10');
    await year.nth(1).fill('2540');

    // Click "เกษียณอายุ 60 ปี" — should auto-fill endDate via calculateRetirementDate
    await page.getByRole('button', { name: /เกษียณอายุ 60 ปี/ }).click();
    await page.waitForTimeout(200);

    // Assert: end year is 2570 (NOT 2571 — the bug). Day/month are zero-padded
    // to width 2 by `partsFrom` in CalendarPickerTH.tsx:62-63.
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

  test('age50 option requires both prereq dates (warns when missing)', async ({ page }) => {
    await enterStep1(page);

    // Click age50 with no dates → amber warning, option not selected
    await page.getByRole('button', { name: /อายุตัว 50 ปี/ }).click();
    await expect(
      page.locator('text=กรุณาเลือกวันเกิดและวันบรรจุก่อน'),
    ).toBeVisible();
  });

  // Helper: pre-seed FormState via localStorage so we test the eligibility-
  // computation + render path directly, bypassing the CalendarPickerTH picker
  // (which only fires onChange on blur out of its containerRef — fragile under
  // Playwright's `fill()` which doesn't dispatch a real blur).
  // Mirror of FORM_STATE_SCHEMA_VERSION = 2 in types/index.ts:110.
  const seedFormState = async (
    page: Page,
    state: {
      birthDate: string;
      startDate: string;
      endDate: string;
      retirementOption: 'age60' | 'service25' | 'age50' | 'custom';
    },
  ) => {
    await page.addInitScript((s) => {
      window.localStorage.setItem(
        'early-retire-form',
        JSON.stringify({
          __schemaVersion: 2,
          birthDate: s.birthDate,
          startDate: s.startDate,
          endDate: s.endDate,
          retirementOption: s.retirementOption,
          mode: 'non-gfp',
        }),
      );
    }, state);
  };

  test('age50 happy path: age 55 + service 25 → no warning, ถัดไป enabled', async ({ page }) => {
    // Pre-seed Step 1 inputs: birth 1/1/2515 BE = 1/1/1972 CE → age 55 at end
    //                        start 1/1/2545 BE = 1/1/2002 CE → 25 yrs service
    //                        end   1/1/2570 BE = 1/1/2027 CE
    await seedFormState(page, {
      birthDate: '1972-01-01T00:00:00.000Z',
      startDate: '2002-01-01T00:00:00.000Z',
      endDate: '2027-01-01T00:00:00.000Z',
      retirementOption: 'age50',
    });
    await page.goto('/');
    // Step 0: mode is already 'non-gfp' from seed, advance to Step 1
    await page.locator('button:has-text("เริ่มคำนวณ")').click();
    await page.waitForTimeout(400);

    // No eligibility warning visible
    await expect(
      page.locator('text=อายุยังไม่ถึง 50 ปี ณ วันที่เลือก'),
    ).toHaveCount(0);
    await expect(
      page.locator('text=อายุราชการยังไม่ถึง 10 ปี ณ วันที่เลือก'),
    ).toHaveCount(0);

    // ถัดไป enabled (all dates valid, eligibility passes)
    await expect(page.locator('button:has-text("ถัดไป")')).toBeEnabled();
  });

  test('age50 warn path: age 49 → amber warning + ถัดไป disabled', async ({ page }) => {
    // Pre-seed: birth 1/1/2521 BE = 1/1/1978 CE → age 49 at end
    //           start 1/1/2545 BE = 1/1/2002 CE → 25 yrs service (service is fine)
    //           end   1/1/2570 BE = 1/1/2027 CE
    await seedFormState(page, {
      birthDate: '1978-01-01T00:00:00.000Z',
      startDate: '2002-01-01T00:00:00.000Z',
      endDate: '2027-01-01T00:00:00.000Z',
      retirementOption: 'age50',
    });
    await page.goto('/');
    await page.locator('button:has-text("เริ่มคำนวณ")').click();
    await page.waitForTimeout(400);

    // Age warning fires (service is fine; age fails)
    await expect(
      page.locator('text=อายุยังไม่ถึง 50 ปี ณ วันที่เลือก'),
    ).toBeVisible();
    await expect(page.locator('button:has-text("ถัดไป")')).toBeDisabled();
  });

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
      page.getByRole('button', { name: /อายุตัว 50 ปี/ }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /กำหนดเอง/ }),
    ).toBeVisible();
  });
});
