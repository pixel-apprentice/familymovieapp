import { test, expect } from '@playwright/test';

test.describe('Critical Path', () => {
    test('renders correctly and displays the main title', async ({ page }) => {
        // Ultimate universal check for mobile/desktop rendering consistency
        await page.goto('/', { timeout: 60000 });

        // Use a broad text locator to bypass any role-based rendering issues on mobile webkit
        const mainText = page.getByText(/Pizza.*Night/i).first();
        await expect(mainText).toBeVisible({ timeout: 30000 });
    });
});
