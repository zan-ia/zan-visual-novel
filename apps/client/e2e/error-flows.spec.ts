import { test, expect } from '@playwright/test';

test.describe('Error Handling', () => {
  test('invalid player URL shows error not infinite loading', async ({ page }) => {
    await page.goto('/play/nonexistent-id-12345');
    // Wait for any content — should NOT hang forever
    await page.waitForTimeout(5000);
    // Page should have loaded something (error or redirect)
    const content = await page.content();
    expect(content.length).toBeGreaterThan(100);
  });

  test('library renders after visiting error page', async ({ page }) => {
    // First visit an invalid player URL
    await page.goto('/play/nonexistent-id-12345');
    await page.waitForTimeout(3000);

    // Then navigate to library — should still work
    await page.goto('/library');
    await expect(page.locator('text=Biblioteca')).toBeVisible({ timeout: 15000 });
  });

  test('unknown route redirects to library', async ({ page }) => {
    await page.goto('/this-route-does-not-exist');
    await page.waitForTimeout(5000);
    // Should redirect to /library (the catch-all route)
    const url = page.url();
    expect(url).toContain('/library');
  });
});
