import { test, expect } from '@playwright/test';

test.describe('Settings', () => {
  test('should display settings page', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.getByRole('heading', { name: /settings/i })).toBeVisible();
  });

  test('should have settings tabs or sections', async ({ page }) => {
    await page.goto('/settings');
    // Settings should have multiple sections
    const tabs = page.getByRole('tab').or(page.locator('[role="tablist"]'));
    await expect(tabs.first()).toBeVisible();
  });
});
