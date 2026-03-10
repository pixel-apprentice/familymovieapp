import { test, expect } from '@playwright/test';

test.describe('Application Initialization', () => {
    test('renders the main application without uncaught JavaScript exceptions', async ({ page }) => {
        const errors: Error[] = [];

        // Attach an event listener to catch any page/console errors immediately
        page.on('pageerror', (exception) => {
            errors.push(exception);
        });

        // Navigate to the root level home page
        await page.goto('/');

        // Give the React application a moment to render context and hit hooks. We don't use 'networkidle' 
        // here because Vite and Firebase keep active websocket connections running on localhost.
        await page.waitForLoadState('domcontentloaded');

        // Verify the app title mounts 
        // We look for our Pizza Movie Night h1 explicitly
        await expect(page.getByRole('heading', { name: /Pizza Movie Night/i })).toBeVisible({ timeout: 5000 });

        // Assert that zero errors were caught during the entire mounting process
        // If an error like "castContext.setSessionRequest is not a function" occurs,
        // this assertion will fail and display the Error in the test output.
        expect(errors).toHaveLength(0);
    });
});
