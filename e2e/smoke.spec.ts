import { test, expect } from '@playwright/test';

test.describe('Pension Calculator Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    // Ensure a clean slate — wizard remembers state via localStorage between tests
    await page.addInitScript(() => {
      try {
        window.localStorage.removeItem('early-retire-form');
      } catch {
        // ignore
      }
    });
  });

  test('landing page loads with correct title and Step 0', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/คำนวณบำเหน็จบำนาญ/);
    await expect(page.locator('h1')).toContainText('คำนวณบำเหน็จบำนาญ');
    // Step 0 = Mode Select
    await expect(
      page.getByRole('heading', { name: /คุณเป็นสมาชิก กบข\. หรือไม่/ }),
    ).toBeVisible();
  });

  test('completes full 6-step wizard flow and shows results (non-gfp)', async ({
    page,
  }) => {
    await page.goto('/');

    // Step 0: Mode Select — pick non-gfp (button text on Step 0 is "เริ่มคำนวณ")
    await page.getByRole('radio', { name: /ไม่เป็นสมาชิก กบข\./ }).click();
    await page.locator('button:has-text("เริ่มคำนวณ")').click();
    await page.waitForTimeout(400);

    // Step 1: Personal Info (3 date pickers always visible)
    const dayInputs = page.locator('[placeholder="วว"]');
    const monthInputs = page.locator('[placeholder="ดด"]');
    const yearInputs = page.locator('[placeholder="ปปปป (พ.ศ.)"]');

    // Birth date
    await dayInputs.nth(0).fill('15');
    await monthInputs.nth(0).fill('05');
    await yearInputs.nth(0).fill('2500');

    // Start date
    await dayInputs.nth(1).fill('01');
    await monthInputs.nth(1).fill('10');
    await yearInputs.nth(1).fill('2540');

    // End date (custom)
    await dayInputs.nth(2).fill('01');
    await monthInputs.nth(2).fill('10');
    await yearInputs.nth(2).fill('2570');

    await page.locator('button:has-text("ถัดไป")').click();
    await page.waitForTimeout(400);

    // Step 2: Service Period (skip — defaults are fine)
    await page.locator('button:has-text("ถัดไป")').click();
    await page.waitForTimeout(400);

    // Step 3: Salary History (currentSalary)
    // Input.tsx renders numeric fields as type="text" + inputMode="decimal"
    // (avoids the <input type=number> step-snap bug). Select via inputmode.
    await page
      .locator('input[inputmode="decimal"]')
      .first()
      .fill('40000');
    await page.locator('button:has-text("ถัดไป")').click();
    await page.waitForTimeout(400);

    // Step 4: การคำนวณ (table) — proceed without edits
    await page.locator('button:has-text("ดูผลลัพธ์")').click();
    await page.waitForTimeout(500);

    // Step 5: Results — assert all 3 amounts shown
    await expect(page.getByRole('heading', { name: 'สรุปบำเหน็จบำนาญ' })).toBeVisible();
    // Use heading roles to disambiguate from the new comparison-card body text
    // which also contains "เงินบำเหน็จ..." substrings.
    await expect(
      page.getByRole('heading', { name: /^เงินบำเหน็จ \(ก้อน\)$/ }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /^เงินบำนาญรายเดือน$/ }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /^บำเหน็จดำรงชีพ$/ }),
    ).toBeVisible();
    // Disclaimer present
    await expect(page.locator('text=ประมาณการเบื้องต้น')).toBeVisible();
  });

  test('completes full 6-step wizard flow and shows results (gfp)', async ({
    page,
  }) => {
    await page.goto('/');

    // Step 0: Mode Select — pick gfp (button text on Step 0 is "เริ่มคำนวณ")
    await page.getByRole('radio', { name: /^เป็นสมาชิก กบข\./ }).click();
    await page.locator('button:has-text("เริ่มคำนวณ")').click();
    await page.waitForTimeout(400);

    // Step 1
    const dayInputs = page.locator('[placeholder="วว"]');
    const monthInputs = page.locator('[placeholder="ดด"]');
    const yearInputs = page.locator('[placeholder="ปปปป (พ.ศ.)"]');

    await dayInputs.nth(0).fill('15');
    await monthInputs.nth(0).fill('05');
    await yearInputs.nth(0).fill('2500');

    await dayInputs.nth(1).fill('01');
    await monthInputs.nth(1).fill('10');
    await yearInputs.nth(1).fill('2540');

    await dayInputs.nth(2).fill('01');
    await monthInputs.nth(2).fill('10');
    await yearInputs.nth(2).fill('2570');

    await page.locator('button:has-text("ถัดไป")').click();
    await page.waitForTimeout(400);

    // Step 2
    await page.locator('button:has-text("ถัดไป")').click();
    await page.waitForTimeout(400);

    // Step 3
    // Input.tsx renders numeric fields as type="text" + inputMode="decimal"
    // (avoids the <input type=number> step-snap bug). Select via inputmode.
    await page
      .locator('input[inputmode="decimal"]')
      .first()
      .fill('40000');
    await page.locator('button:has-text("ถัดไป")').click();
    await page.waitForTimeout(400);

    // Step 4
    await page.locator('button:has-text("ดูผลลัพธ์")').click();
    await page.waitForTimeout(500);

    // Step 5 — gfp shows the same 3 amounts (computed differently)
    await expect(page.getByRole('heading', { name: 'สรุปบำเหน็จบำนาญ' })).toBeVisible();
    // Use heading roles to disambiguate from the new comparison-card body text
    // which also contains "เงินบำเหน็จ..." substrings.
    await expect(
      page.getByRole('heading', { name: /^เงินบำเหน็จ \(ก้อน\)$/ }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /^เงินบำนาญรายเดือน$/ }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /^บำเหน็จดำรงชีพ$/ }),
    ).toBeVisible();
  });

  test('mode selection gates progression', async ({ page }) => {
    await page.goto('/');
    // Without picking a mode, the Step-0 CTA button should be disabled
    const nextBtn = page.locator('button:has-text("เริ่มคำนวณ")');
    await expect(nextBtn).toBeDisabled();

    // After picking, it enables
    await page.getByRole('radio', { name: /ไม่เป็นสมาชิก กบข\./ }).click();
    await expect(nextBtn).toBeEnabled();
  });

  test('legacy localStorage shape is silently cleared on first load', async ({
    page,
  }) => {
    // Override the beforeEach init script so the legacy state is NOT cleared
    await page.addInitScript(() => {
      window.localStorage.setItem(
        'early-retire-form',
        JSON.stringify({
          // Schema version 1 is the pre-redesign shape
          __schemaVersion: 1,
          birthDate: '2000-01-01T00:00:00.000Z',
          startDate: '2025-01-01T00:00:00.000Z',
          endDate: '2030-01-01T00:00:00.000Z',
          mode: 'gfp',
        }),
      );
    });
    await page.goto('/');
    // Should land on Step 0 (Mode Select) with no mode selected — saved data discarded
    await expect(
      page.getByRole('heading', { name: /คุณเป็นสมาชิก กบข\./ }),
    ).toBeVisible();
    // The Step-0 CTA must be disabled because no mode is selected (proof saved mode='gfp' was discarded)
    await expect(page.locator('button:has-text("เริ่มคำนวณ")')).toBeDisabled();
  });
});
