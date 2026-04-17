import { test, expect } from '@playwright/test';

test.describe('Board', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/board');
  });

  test('should display board page with columns', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Board' })).toBeVisible();
    // Board should have at least one column
    await expect(page.locator('[role="region"]').first()).toBeVisible();
  });

  test('should display task cards in columns', async ({ page }) => {
    // Wait for board to load
    await page.waitForSelector('[role="region"]');
    // Should have task cards
    const cards = page.locator('[role="button"]').filter({ hasText: /.+/ });
    expect(await cards.count()).toBeGreaterThan(0);
  });

  test('should open task detail on click', async ({ page }) => {
    await page.waitForSelector('[role="region"]');
    // Click first task card
    const firstCard = page.locator('[role="button"]').first();
    await firstCard.click();
    // Detail panel should appear
    await expect(page.getByText(/description|details|assignee/i).first()).toBeVisible();
  });

  test('should have create task button', async ({ page }) => {
    await expect(page.getByText(/add task|create task/i).first()).toBeVisible();
  });

  test('should have toolbar with search and filters', async ({ page }) => {
    // Search input or button should exist
    await expect(page.getByPlaceholder(/search/i).or(page.getByLabel(/search/i)).first()).toBeVisible();
  });
});
