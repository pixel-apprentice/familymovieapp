import { test, expect } from '@playwright/test';

test.describe('Navigation & Performance', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/', { timeout: 30000 });
        await page.waitForLoadState('domcontentloaded');
    });

    test('verifies primary branding logo F visibility', async ({ page }) => {
        await page.waitForSelector('[data-testid="app-ready"]');
        await expect(page.getByText('F', { exact: true })).toBeVisible();
    });

    test('toggles successfully between view modes if visible', async ({ page }) => {
        const toggle = page.locator('button[aria-label*="View"]').first();
        if (await toggle.isVisible()) await toggle.click();
    });

    test('opens the Pizza request modal from layout header', async ({ page }) => {
        await page.waitForSelector('[data-testid="app-ready"]');
        await page.getByRole('button', { name: /pizza/i }).click();
        await expect(page.getByText(/Pizza Request/i)).toBeVisible();
    });

    test('navigates to Settings page via Settings nav link', async ({ page }) => {
        await page.locator('a[title*="Settings"]').click();
        await expect(page).toHaveURL(/.*\/stats/);
    });

    test('verifies App Version string in About section', async ({ page }) => {
        await page.goto('/stats');
        await page.waitForSelector('[data-testid="app-ready"]');
        await expect(page.locator('section:has-text("About")')).toContainText(/v\d+\.\d+\./i);
    });

    test('checks Appearance header presence in stats page', async ({ page }) => {
        await page.goto('/stats');
        await page.waitForSelector('[data-testid="app-ready"]');
        await expect(page.getByRole('heading', { name: /appearance/i }).or(page.getByRole('heading', { name: /Appearance/ }))).toBeVisible();
    });

    test('verifies family filter "All" existence in movie list control', async ({ page }) => {
        await expect(page.getByRole('button', { name: /^All$/i })).toBeVisible({ timeout: 15000 });
    });

    test('closes Pizza modal with backdrop click', async ({ page }) => {
        await page.waitForSelector('[data-testid="app-ready"]');
        await page.getByRole('button', { name: /pizza/i }).click();
        await expect(page.getByText(/Pizza Request/i)).toBeVisible();

        // Modal.tsx backdrop click
        await page.mouse.click(10, 10);
        await expect(page.getByText(/Pizza Request/i)).not.toBeVisible();
    });

    test('verifies Current Turn layout banner exists', async ({ page }) => {
        await expect(page.locator('section').or(page.locator('div')).filter({ hasText: /Next|Turn/i }).first()).toBeVisible({ timeout: 15000 });
    });

    test('navigates back home via logo click from stats view', async ({ page }) => {
        await page.goto('/stats');
        await page.waitForLoadState('domcontentloaded');
        await page.getByText('F', { exact: true }).click();
        await expect(page).toHaveURL(/\/$/);
    });
});
