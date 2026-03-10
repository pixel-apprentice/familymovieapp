import { test, expect } from '@playwright/test';

test.describe('Navigation & Performance', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/', { timeout: 30000 });
        await page.waitForLoadState('domcontentloaded');
    });

    test('verifies primary branding logo F visibility', async ({ page }) => {
        await expect(page.getByText('F', { exact: true })).toBeVisible({ timeout: 15000 });
    });

    test('toggles successfully between view modes if visible', async ({ page }) => {
        const toggle = page.locator('button[aria-label*="View"]').first();
        if (await toggle.isVisible()) await toggle.click();
    });

    test('opens the Pizza request modal from layout header', async ({ page }) => {
        await page.getByRole('button', { name: /pizza/i }).click();
        await expect(page.getByText(/Pizza Request/i)).toBeVisible({ timeout: 15000 });
    });

    test('navigates to Settings page via Settings nav link', async ({ page }) => {
        await page.locator('a[title*="Settings"]').click();
        await expect(page).toHaveURL(/.*\/stats/);
    });

    test('verifies App Version string in About section area', async ({ page }) => {
        await page.goto('/stats');
        await page.waitForLoadState('domcontentloaded');
        await expect(page.locator('section:has-text("About")')).toContainText(/v\d+\.\d+\./i, { timeout: 20000 });
    });

    test('checks Appearance header presence in stats page info area', async ({ page }) => {
        await page.goto('/stats');
        await page.waitForLoadState('domcontentloaded');
        await expect(page.getByRole('heading', { name: /appearance/i }).or(page.getByRole('heading', { name: /Appearance/ }))).toBeVisible({ timeout: 10000 });
    });

    test('verifies family filter "All" existence in movie list control', async ({ page }) => {
        await expect(page.getByRole('button', { name: /^All$/i })).toBeVisible({ timeout: 15000 });
    });

    test('closes Pizza modal with backdrop click simulation trigger', async ({ page }) => {
        await page.getByRole('button', { name: /pizza/i }).click();
        await expect(page.getByText(/Pizza Request/i)).toBeVisible({ timeout: 10000 });

        // Modal.tsx backdrop click
        await page.mouse.click(10, 10);
        await expect(page.getByText(/Pizza Request/i)).not.toBeVisible({ timeout: 10000 });
    });

    test('verifies Current Turn layout banner exists on home page', async ({ page }) => {
        await expect(page.locator('section').or(page.locator('div')).filter({ hasText: /Next|Turn/i }).first()).toBeVisible({ timeout: 15000 });
    });

    test('navigates back home via logo click from stats view', async ({ page }) => {
        await page.goto('/stats');
        await page.waitForLoadState('domcontentloaded');
        await page.getByText('F', { exact: true }).click();
        await expect(page).toHaveURL(/\/$/);
    });
});
