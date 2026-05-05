import { test, expect } from '@playwright/test';

/**
 * E2E coverage for the calculation table edit + navigation flows that the
 * unit-level verification suite cannot reach (UI bindings, override drafts,
 * banner visibility, navigate-back-and-forth state, mode toggle).
 *
 * Background: PRs #29, #37, #47, #48, #52, #54, #55 iterated on the cascade
 * semantics. These tests freeze the contract from the user's perspective.
 */
test.describe('Calculation table — edit + navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.addInitScript(() => {
      try { window.localStorage.removeItem('early-retire-form'); } catch {}
    });
  });

  // Shared helper to advance from Step 0 → Step 5 (calculation table) with
  // the user's reported "30000 ชำนาญการ 2%" scenario which lands in the
  // bracket-boundary gap (PR #54 target).
  const arriveAtCalculationTable = async (page: import('@playwright/test').Page) => {
    await page.goto('/');

    // Step 0: gfp
    await page.getByRole('radio', { name: /^เป็นสมาชิก กบข\./ }).click();
    await page.locator('button:has-text("เริ่มคำนวณ")').click();
    await page.waitForTimeout(400);

    // Step 1
    const day = page.locator('[placeholder="วว"]');
    const month = page.locator('[placeholder="ดด"]');
    const year = page.locator('[placeholder="ปปปป (พ.ศ.)"]');
    await day.nth(0).fill('01'); await month.nth(0).fill('01'); await year.nth(0).fill('2524');
    await day.nth(1).fill('01'); await month.nth(1).fill('06'); await year.nth(1).fill('2555');
    await day.nth(2).fill('01'); await month.nth(2).fill('10'); await year.nth(2).fill('2584');
    await page.locator('button:has-text("ถัดไป")').click();
    await page.waitForTimeout(400);

    // Step 2 (defaults OK)
    await page.locator('button:has-text("ถัดไป")').click();
    await page.waitForTimeout(400);

    // Step 3 (skip — defaults)
    await page.locator('button:has-text("ถัดไป")').click();
    await page.waitForTimeout(400);

    // Step 4: salary history — currentSalary 30000, default %s
    await page.locator('input[inputmode="decimal"]').first().fill('30000');
    await page.locator('button:has-text("ถัดไป")').click();
    await page.waitForTimeout(500);
  };

  test('default state: anchor row newSalary equals currentSalary', async ({ page }) => {
    await arriveAtCalculationTable(page);

    // Anchor row marked with "ปัจจุบัน" badge — its newSalary cell should be 30,000.
    const anchorRow = page.locator('tr').filter({ has: page.locator('text=ปัจจุบัน') }).first();
    await expect(anchorRow).toBeVisible();
    await expect(anchorRow).toContainText('30,000');
  });

  test('override banner does NOT appear when no edits exist', async ({ page }) => {
    await arriveAtCalculationTable(page);
    await expect(page.locator('text=มีแถวที่ปักหมุดค่าไว้')).not.toBeVisible();
  });

  test('navigate back to Step 4 then forward — overrides persist + banner shows', async ({ page }) => {
    await arriveAtCalculationTable(page);

    // Edit the first row's % via the pencil icon. Find the first edit button
    // and click it.
    const firstEditButton = page.locator('button[aria-label*="แก้ไข"]').first();
    await firstEditButton.click();
    await page.waitForTimeout(200);

    // Find the % input in the editing row — third numeric input in the editing row
    const editingPercentInput = page.locator('tr').filter({ has: page.locator('button[aria-label*="เสร็จ"]') }).locator('input').nth(2);
    if (await editingPercentInput.count() > 0) {
      await editingPercentInput.fill('4');
      await page.waitForTimeout(200);
    }

    // Done editing
    const doneButton = page.locator('button[aria-label*="เสร็จ"]').first();
    if (await doneButton.count() > 0) {
      await doneButton.click();
      await page.waitForTimeout(300);
    }

    // Banner should now be visible
    await expect(page.locator('text=มีแถวที่ปักหมุดค่าไว้')).toBeVisible({ timeout: 3000 });

    // Navigate back to Step 4
    await page.locator('button:has-text("กลับ")').click();
    await page.waitForTimeout(400);

    // Forward to Step 5 again
    await page.locator('button:has-text("ถัดไป")').click();
    await page.waitForTimeout(500);

    // Banner should STILL be visible (overrides persist)
    await expect(page.locator('text=มีแถวที่ปักหมุดค่าไว้')).toBeVisible();
  });

  test('bulk reset button clears all overrides and hides the banner', async ({ page }) => {
    await arriveAtCalculationTable(page);

    // Manually inject an override via localStorage to trigger the banner
    // without depending on UI edit interaction stability.
    await page.evaluate(() => {
      const raw = window.localStorage.getItem('early-retire-form');
      if (!raw) return;
      const form = JSON.parse(raw);
      form.salaryOverrides = [{ effectiveDate: null, level: null, percent: 4, oldSalary: null, newSalary: null }];
      window.localStorage.setItem('early-retire-form', JSON.stringify(form));
    });
    await page.reload();
    await page.waitForTimeout(500);

    // Banner visible
    await expect(page.locator('text=มีแถวที่ปักหมุดค่าไว้')).toBeVisible({ timeout: 3000 });

    // Click "ใช้ค่าเฉลี่ยทุกแถว" button
    await page.locator('button:has-text("ใช้ค่าเฉลี่ยทุกแถว")').click();
    await page.waitForTimeout(300);

    // Banner gone
    await expect(page.locator('text=มีแถวที่ปักหมุดค่าไว้')).not.toBeVisible();
  });
});
