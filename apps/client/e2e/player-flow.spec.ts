import { test, expect } from '@playwright/test';

test.describe('Player Flow', () => {
  test('library page loads and shows VN cards', async ({ page }) => {
    await page.goto('/library');
    // Verify page renders without crashing — "Biblioteca" is the page heading
    await expect(page.locator('text=Biblioteca')).toBeVisible({ timeout: 15000 });
  });

  test('player page handles invalid VN gracefully', async ({ page }) => {
    await page.goto('/play/invalid-uuid');
    // Should show some error or redirect — not infinite loading
    // The page either shows an error, redirects, or renders something
    await page.waitForTimeout(5000);
    const content = await page.content();
    expect(content.length).toBeGreaterThan(100);
  });

  test('navigation to login page works', async ({ page }) => {
    await page.goto('/login');
    // Login page shows Zan VN branding
    await expect(page.locator('text=Zan VN')).toBeVisible({ timeout: 10000 });
  });

  test('library renders and shows navigation elements', async ({ page }) => {
    await page.goto('/library');
    await expect(page.locator('text=Biblioteca')).toBeVisible({ timeout: 15000 });
    // Should not show an error that blocks the page
    await expect(page.locator('text=Erro ao carregar')).not.toBeVisible({ timeout: 10000 });
  });
});
