import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should load dashboard', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Linear Precision/i);
  });

  test('should have sidebar with all nav items', async ({ page }) => {
    await page.goto('/');
    // Check sidebar exists on desktop
    const sidebar = page.locator('aside').first();
    await expect(sidebar).toBeVisible();

    // Check key nav items
    await expect(sidebar.getByText('Projects')).toBeVisible();
    await expect(sidebar.getByText('Board')).toBeVisible();
    await expect(sidebar.getByText('Calendar')).toBeVisible();
    await expect(sidebar.getByText('Goals')).toBeVisible();
    await expect(sidebar.getByText('Settings')).toBeVisible();
  });

  test('should navigate to board page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Board' }).click();
    await expect(page).toHaveURL(/board/);
  });

  test('should navigate to projects page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Projects' }).click();
    await expect(page).toHaveURL(/projects/);
  });

  test('should show 404 for unknown routes', async ({ page }) => {
    await page.goto('/this-does-not-exist');
    await expect(page.getByText(/not found/i)).toBeVisible();
  });
});
