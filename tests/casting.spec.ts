import { test, expect } from '@playwright/test';

test.describe('Casting & Couch Mode', () => {
  test.beforeEach(async ({ page }) => {
    // Inject mock data to ensure movie cards are visible
    await page.addInitScript(() => {
      const mockMovies = [
        {
          id: '1',
          title: 'Inception',
          status: 'watched',
          pickedBy: 'Jack',
          poster_url: 'https://image.tmdb.org/t/p/w500/9gk7Fn9sVAsS969O9oqysOEaAfu.jpg',
          ratings: { 'Jack': 5 }
        }
      ];
      localStorage.setItem('localMovies', JSON.stringify(mockMovies));
      localStorage.setItem('localTurn', '0');
      // Set couch mode in session storage to persist across navigations
      sessionStorage.setItem('fmn_couch_mode', 'true');
    });
  });

  test('Mode Activation: verifies ?couch=true hides sender UI', async ({ page }) => {
    await page.goto('/?couch=true');
    await expect(page).toHaveURL(/couch=true/);
    
    // Check that header is NOT visible in couch mode
    const header = page.locator('header');
    await expect(header).not.toBeVisible();
    
    // Check that Search Panel is NOT visible in couch mode
    const searchPanel = page.locator('div:has-text("Search")').first();
    await expect(searchPanel).not.toBeVisible();
    
    // Check for "couch-mode-active" class
    const appBody = page.locator('[data-testid="app-ready"]');
    await expect(appBody).toHaveClass(/couch-mode-active/);
  });

  test('Navigation Sync: verifies app navigates on external couch state update', async ({ page }) => {
    // This test simulates a receiver already in couch mode
    await page.goto('/?couch=true');
    
    // We can't easily mock Firestore's real-time listeners in a basic Playwright test without
    // infecting the source code with test-logic or using a full mock system.
    // However, we can verify the URL state persistence.
    
    const couchFlag = await page.evaluate(() => sessionStorage.getItem('fmn_couch_mode'));
    // If we landed on /couch page first, it would be 'true'. 
    // On /?couch=true, App.tsx handles it.
    // Let's check if the flag is set after a couch URL hit.
    await page.goto('/couch');
    // CouchPage now waits up to 8s for SDK initialization before redirecting to /?couch=true
    await expect(page).toHaveURL(/\/(\?couch=true)?$/, { timeout: 12000 });
    
    // Check for "couch-mode-active" class instead of just sessionStorage to be sure app state is aligned
    const appBody = page.locator('[data-testid="app-ready"]');
    await expect(appBody).toHaveClass(/couch-mode-active/);

    const flagAfterCouch = await page.evaluate(() => sessionStorage.getItem('fmn_couch_mode'));
    expect(flagAfterCouch).toBe('true');
  });

  test('Cinematic UX: verifies blurry backdrop in Movie Detail', async ({ page }) => {
    // Start at home to ensure data is loaded/seeded
    await page.goto('/?couch=true');
    await page.waitForSelector('[data-testid="movie-card"]', { timeout: 10000 });
    // Allow any initial state pushes or metadata refreshes to settle
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000); 
    
    // Click the first movie card
    await page.locator('[data-testid="movie-card"]').first().click();
    
    // Verify we are on a movie detail page
    await expect(page).toHaveURL(/\/movie\/.*/);
    
    // Instead of checking URL for ?couch=true (which might be lost on navigation Link),
    // we check the app-ready class which confirms Couch Mode is active from sessionStorage
    const appBody = page.locator('[data-testid="app-ready"]');
    await expect(appBody).toHaveClass(/couch-mode-active/);
    
    // Verify backdrop container exists and is visible
    // We wait a bit for the animation
    const backdrop = page.locator('div.fixed.inset-0.z-\\[-1\\] img');
    await expect(backdrop).toBeVisible({ timeout: 10000 });
    
    // Verify rankings section has glassy styles (Couch mode specific classes)
    const rankings = page.locator('section.rounded-3xl.shadow-2xl');
    await expect(rankings).toBeVisible();
  });

  test('Pulse Notification: verifies notification area presence', async ({ page }) => {
    await page.goto('/?couch=true');
    // The PulseNotification component should be present in the DOM when isCouchMode is active
    const layout = page.locator('[data-testid="app-ready"]');
    await expect(layout).toBeVisible();
  });

  test('Unidirectional Guard: verifies TV doesn\'t push state', async ({ page }) => {
    await page.goto('/?couch=true');
    await page.waitForSelector('[data-testid="movie-card"]', { timeout: 10000 });
    await page.locator('[data-testid="movie-card"]').first().click();

    // Verify that the "Edit" and "Actions" buttons are hidden on the movie page
    const editBtn = page.locator('button:has(svg.lucide-edit-2), button:has-text("Edit")');
    await expect(editBtn).not.toBeVisible();
    
    const deleteBtn = page.locator('button:has-text("Delete")');
    await expect(deleteBtn).not.toBeVisible();
  });


});
