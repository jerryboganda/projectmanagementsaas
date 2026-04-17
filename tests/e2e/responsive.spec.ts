import { test, expect } from '@playwright/test';

test.describe('Responsive Design', () => {
  test('mobile: should hide desktop sidebar', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    const desktopSidebar = page.locator('aside.hidden.md\\:flex');
    await expect(desktopSidebar).not.toBeVisible();
  });

  test('mobile: should show hamburger menu', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    const menuButton = page.getByLabel(/toggle.*nav|menu/i);
    await expect(menuButton).toBeVisible();
  });

  test('desktop: should show sidebar', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    const sidebar = page.locator('aside').first();
    await expect(sidebar).toBeVisible();
  });

  test('tablet: should be usable at 768px', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await expect(page).toHaveTitle(/Linear Precision/i);
  });
});
