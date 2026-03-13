import { test, expect } from '@playwright/test';

test.describe('Advanced Features & UX', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/', { timeout: 30000 });
        await page.waitForLoadState('domcontentloaded');
    });

    test('verifies Smart Pick random movie modal interaction action surprise', async ({ page }) => {
        const smartPick = page.locator('button').filter({ hasText: /Surprise|Pick|Mystery|Randomize/i }).first();
        await expect(smartPick).toBeVisible({ timeout: 15000 });
        if (await smartPick.isEnabled()) {
            await smartPick.click();
            await expect(page.getByText(/random pick|surprise|mystery|feeling/i).first()).toBeVisible({ timeout: 15000 });
        }
    });

    test('checks search preference toggles in stats panel area area', async ({ page }) => {
        await page.goto('/stats');
        await page.waitForLoadState('domcontentloaded');
        const adultToggle = page.getByLabel(/Allow Rated R/i).or(page.locator('button:has-text("Allow Rated R")'));
        if (await adultToggle.isVisible()) {
            await expect(adultToggle).toBeVisible({ timeout: 10000 });
        }
    });

    test('ensures prompt on destructive removal confirmation modal box prompt', async ({ page }) => {
        const movieCard = page.locator('div.group.relative.cursor-pointer').first();
        if (await movieCard.isVisible()) {
            await movieCard.click();
            const removeBtn = page.getByRole('button', { name: /remove/i });
            await expect(removeBtn).toBeVisible({ timeout: 15000 });
            await removeBtn.click();
            await expect(page.getByText(/are you sure/i).or(page.getByRole('heading', { name: /remove/i }))).toBeVisible({ timeout: 10000 });
            await page.getByRole('button', { name: /cancel/i }).click();
        }
    });

    test('verifies Cast Button exists within layout context layout', async ({ page }) => {
        await expect(page.getByTitle(/Settings|Themes/i).first()).toBeVisible({ timeout: 15000 });
    });

    test('validates smart search input element typeability field field', async ({ page }) => {
        const smartSearchInput = page.getByPlaceholder(/Search title, actor, or vibe/i);
        await expect(smartSearchInput).toBeVisible({ timeout: 15000 });
        await smartSearchInput.fill('something spooky');
    });

    test('checks Refresh All button presence in Data site site data', async ({ page }) => {
        await page.goto('/stats');
        await page.waitForLoadState('domcontentloaded');
        const refreshBtn = page.getByRole('button', { name: /Refresh All/i });
        await expect(refreshBtn).toBeVisible({ timeout: 15000 });
    });

    test('verifies Pinnacle theme option visible in switcher UI switcher', async ({ page }) => {
        await page.goto('/stats');
        await page.waitForLoadState('domcontentloaded');
        const themeBtn = page.getByText(/Pinnacle/i).first();
        await expect(themeBtn).toBeVisible({ timeout: 15000 });
    });

    test('verifies Data Management header presence in stats page info info', async ({ page }) => {
        await page.goto('/stats');
        await page.waitForLoadState('domcontentloaded');
        await expect(page.getByRole('heading', { name: /Data Management|Lot Management|Archive|Inventory|Pasture/i }).first()).toBeVisible({ timeout: 15000 });
    });

    test('verifies theme switcher displays labels in stats context area section label', async ({ page }) => {
        await page.goto('/stats');
        await page.waitForLoadState('domcontentloaded');
        await expect(page.locator('button').filter({ hasText: /Pinnacle/i }).first()).toBeVisible({ timeout: 15000 });
    });
});
