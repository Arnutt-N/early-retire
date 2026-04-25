import { test, expect } from '@playwright/test';

test.describe('Pension Calculator Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
  });

  test('landing page loads with correct title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/คำนวณบำเหน็จบำนาญ/);
    await expect(page.locator('text=คำนวณบำเหน็จบำนาญ')).toBeVisible();
  });

  test('completes full wizard flow and shows results', async ({ page }) => {
    await page.goto('/');

    // Step 1: Personal Info (3 date pickers on page)
    const dayInputs = page.locator('[placeholder="วว"]');
    const monthInputs = page.locator('[placeholder="ดด"]');
    const yearInputs = page.locator('[placeholder="ปปปป (พ.ศ.)"]');

    // Birth date (index 0)
    await dayInputs.nth(0).fill('15');
    await monthInputs.nth(0).fill('05');
    await yearInputs.nth(0).fill('2500');

    // Start date (index 1)
    await dayInputs.nth(1).fill('01');
    await monthInputs.nth(1).fill('10');
    await yearInputs.nth(1).fill('2560');

    // End date (index 2) - fill directly instead of using retirement option
    await dayInputs.nth(2).fill('01');
    await monthInputs.nth(2).fill('10');
    await yearInputs.nth(2).fill('2565');

    await page.locator('button:has-text("ถัดไป")').click();
    await page.waitForTimeout(500);

    // Step 2: Service Period
    await page.locator('text=ถัดไป').click();
    await page.waitForTimeout(500);

    // Step 3: Salary History - select position
    await page.locator('select, [role="combobox"]').first().selectOption('เจ้าพนักงานพัสดุ');
    await page.locator('input[type="number"]').first().fill('40000');
    await page.locator('text=ถัดไป').click();
    await page.waitForTimeout(500);

    // Step 4: Salary Table
    await page.locator('text=ถัดไป').click();
    await page.waitForTimeout(500);

    // Step 5: Results
    await expect(page.locator('text=ผลการคำนวณ')).toBeVisible();
    await expect(page.locator('text=เงินบำเหน็จ')).toBeVisible();
    await expect(page.locator('text=เงินบำนาญรายเดือน')).toBeVisible();
  });

  test('can toggle between non-gfp and gfp results', async ({ page }) => {
    await page.goto('/');

    // Fill required fields to reach results
    const dayInputs = page.locator('[placeholder="วว"]');
    const monthInputs = page.locator('[placeholder="ดด"]');
    const yearInputs = page.locator('[placeholder="ปปปป (พ.ศ.)"]');

    await dayInputs.nth(0).fill('15');
    await monthInputs.nth(0).fill('05');
    await yearInputs.nth(0).fill('2500');

    await dayInputs.nth(1).fill('01');
    await monthInputs.nth(1).fill('10');
    await yearInputs.nth(1).fill('2560');

    await dayInputs.nth(2).fill('01');
    await monthInputs.nth(2).fill('10');
    await yearInputs.nth(2).fill('2565');

    await page.locator('button:has-text("ถัดไป")').click();
    await page.waitForTimeout(500);
    await page.locator('text=ถัดไป').click();
    await page.waitForTimeout(500);
    await page.locator('select, [role="combobox"]').first().selectOption('เจ้าพนักงานพัสดุ');
    await page.locator('input[type="number"]').first().fill('40000');
    await page.locator('text=ถัดไป').click();
    await page.waitForTimeout(500);
    await page.locator('text=ถัดไป').click();
    await page.waitForTimeout(500);

    await expect(page.locator('text=ผลการคำนวณ')).toBeVisible();

    // Toggle GFP mode
    await page.locator('text=เป็นสมาชิก กบข.').click();
    await expect(page.locator('text=เงินบำนาญรายเดือน')).toBeVisible();

    // Toggle back
    await page.locator('text=ไม่เป็นสมาชิก กบข.').click();
    await expect(page.locator('text=เงินบำนาญรายเดือน')).toBeVisible();
  });
});
