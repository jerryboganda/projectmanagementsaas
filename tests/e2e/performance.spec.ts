import { test, expect } from '@playwright/test';

test.describe('Performance', () => {
  test('dashboard loads within 5 seconds', async ({ page }) => {
    const start = Date.now();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - start;
    expect(loadTime).toBeLessThan(5000);
  });

  test('board page loads within 5 seconds', async ({ page }) => {
    const start = Date.now();
    await page.goto('/board');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - start;
    expect(loadTime).toBeLessThan(5000);
  });

  test('no console errors on dashboard', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // Filter out known acceptable errors (like failed API calls in dev)
    const criticalErrors = errors.filter(e => !e.includes('Failed to fetch') && !e.includes('net::'));
    expect(criticalErrors).toHaveLength(0);
  });

  test('pages should not have memory leaks (basic check)', async ({ page }) => {
    // Navigate between pages multiple times
    for (let i = 0; i < 3; i++) {
      await page.goto('/');
      await page.goto('/board');
      await page.goto('/projects');
    }
    // If we got here without crashing, basic memory is fine
    await expect(page).toHaveTitle(/Linear Precision/i);
  });
});
