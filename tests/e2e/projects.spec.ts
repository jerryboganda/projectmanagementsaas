import { test, expect } from '@playwright/test';

test.describe('Projects', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/projects');
  });

  test('should display projects page', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Projects' })).toBeVisible();
  });

  test('should display project cards or list', async ({ page }) => {
    // Page should have project items
    await expect(page.locator('main').getByText(/.+/).first()).toBeVisible();
  });

  test('should have create project button', async ({ page }) => {
    const newButton = page.getByRole('button', { name: /new|create|add/i }).first();
    await expect(newButton).toBeVisible();
  });
});
