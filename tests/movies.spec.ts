import { test, expect } from '@playwright/test';

test.describe('Movie Management Suite', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/', { timeout: 30000 });
        await page.waitForLoadState('domcontentloaded');
    });

    test('performs live search and verifies result card match', async ({ page }) => {
        const searchInput = page.getByRole('textbox').first();
        await searchInput.fill('The Matrix');
        const responsePromise = page.waitForResponse(/.*\/api\/tmdb\/search.*/);
        await page.keyboard.press('Enter');
        await responsePromise;
        const result = page.locator('div.group', { hasText: /The Matrix/i }).first();
        await expect(result).toBeVisible({ timeout: 15000 });
    });

    test('verifies search "Clear Results" works after search action query', async ({ page }) => {
        const searchInput = page.getByRole('textbox').first();
        await searchInput.fill('Matrix');
        await page.keyboard.press('Enter');
        const clearBtn = page.getByRole('button', { name: /Clear/i });
        await expect(clearBtn).toBeVisible({ timeout: 15000 });
        await clearBtn.click();
        await expect(page.locator('div.group.cursor-pointer')).toHaveCount(0);
    });

    test('handles whitespace-only query elegantly without full search trigger', async ({ page }) => {
        const searchInput = page.getByRole('textbox').first();
        await searchInput.fill('   ');
        await page.keyboard.press('Enter');
        await expect(page.locator('div.group.cursor-pointer')).toHaveCount(0);
    });

    test('opens detail modal and checks internal title text match results', async ({ page }) => {
        await page.getByRole('textbox').first().fill('Inception');
        const responsePromise = page.waitForResponse(/.*\/api\/tmdb\/search.*/);
        await page.keyboard.press('Enter');
        await responsePromise;
        await page.locator('div.group.cursor-pointer', { hasText: /Inception/i }).first().click();
        const header = page.locator('h3', { hasText: /Inception/i }).first();
        await expect(header).toBeVisible({ timeout: 15000 });
    });

    test('verifies case-insensitive search UI result match match', async ({ page }) => {
        await page.getByRole('textbox').first().fill('inception');
        await page.keyboard.press('Enter');
        await expect(page.locator('div.group.cursor-pointer', { hasText: /Inception/i }).first()).toBeVisible({ timeout: 15000 });
    });

    test('verifies movie result cards display poster area card', async ({ page }) => {
        await page.getByRole('textbox').first().fill('Matrix');
        await page.keyboard.press('Enter');
        await expect(page.locator('div.group.cursor-pointer').first()).toBeVisible({ timeout: 15000 });
    });

    test('closes search result modal via clicking X icon from header', async ({ page }) => {
        await page.getByRole('textbox').first().fill('Speed Racer');
        await page.keyboard.press('Enter');
        await page.locator('div.group.cursor-pointer', { hasText: /Speed Racer/i }).first().click();

        // Find X icon button using role and has locator
        const closeBtn = page.getByRole('button').filter({ has: page.locator('svg.lucide-x') }).first();
        await closeBtn.click();
        await expect(page.locator('h3', { hasText: /Speed Racer/i })).not.toBeVisible({ timeout: 10000 });
    });

    test('verifies results Found message display chip visibility label', async ({ page }) => {
        await page.getByRole('textbox').first().fill('Matrix');
        const responsePromise = page.waitForResponse(/.*\/api\/tmdb\/search.*/);
        await page.keyboard.press('Enter');
        await responsePromise;
        await expect(page.getByText(/Found/i).first()).toBeVisible({ timeout: 15000 });
    });

    test('uses Quick-Add (+) button to instantly add movie to wishlist', async ({ page }) => {
        await page.getByRole('textbox').first().fill('Toy Story');
        const responsePromise = page.waitForResponse(/.*\/api\/tmdb\/search.*/);
        await page.keyboard.press('Enter');
        await responsePromise;

        const card = page.locator('div.group', { hasText: 'Toy Story' }).first();
        const movieTitle = await card.locator('h4').innerText();
        const quickAddBtn = card.getByTitle(/Quick Add/i);
        await expect(quickAddBtn).toBeVisible({ timeout: 15000 });

        await quickAddBtn.click();

        // Verify that the specific movie title is no longer in the results
        await expect(page.locator('h4', { hasText: new RegExp(`^${movieTitle}$`) })).not.toBeVisible({ timeout: 10000 });
    });

    test('verifies search field focus state resilience persistence persist', async ({ page }) => {
        const searchInput = page.getByRole('textbox').first();
        await searchInput.focus();
        await expect(searchInput).toBeFocused({ timeout: 10000 });
    });
});
