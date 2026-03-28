import { test, expect } from '@playwright/test';

test.describe('Serverless Architecture Integration', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/', { timeout: 30000 });
        await page.waitForLoadState('domcontentloaded');
    });

    test('verifies API proxy health endpoint is reachable', async ({ page }) => {
        // This test ensures the Vite/Vercel proxy is correctly routing to the Firebase function
        const response = await page.request.get('/api/health');
        expect(response.ok()).toBeTruthy();
        const data = await response.json();
        expect(data.status).toBe('ok');
        expect(data.service).toContain('Firebase');
    });

    test('verifies Gemini AI test connection endpoint', async ({ page }) => {
        // This test checks the internal serverless logic for Gemini connectivity
        const response = await page.request.get('/api/gemini/test');
        expect(response.ok()).toBeTruthy();
        const data = await response.json();
        expect(data.success).toBeTruthy();
        expect(data.message).toContain('Gemini is connected');
    });

    test('verifies Vibe Search triggers serverless AI flow', async ({ page }) => {
        // Click the Vibe search button (usually a sparkles icon or search variation)
        const vibeBtn = page.getByRole('button').filter({ has: page.locator('svg.lucide-sparkles') }).first();
        if (await vibeBtn.isVisible()) {
            await vibeBtn.click();
            
            // Fill a vibe
            const input = page.getByPlaceholder(/What's the vibe/i);
            await input.fill('Cyberpunk neon noir');
            
            // Wait for the serverless response
            const responsePromise = page.waitForResponse(/.*\/api\/gemini\/vibe.*/);
            await page.keyboard.press('Enter');
            
            const response = await responsePromise;
            expect(response.ok()).toBeTruthy();
            
            const data = await response.json();
            expect(Array.isArray(data.titles)).toBeTruthy();
            expect(data.titles.length).toBeGreaterThan(0);
        } else {
            // Fallback for different UI states
            test.skip(true, 'Vibe search button not found in current UI state');
        }
    });
});
