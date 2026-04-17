import { test, expect } from '@playwright/test';

test.describe('Calendar', () => {
  test('should display calendar page', async ({ page }) => {
    await page.goto('/calendar');
    await expect(page.getByRole('heading', { name: /calendar/i })).toBeVisible();
  });

  test('should show current month', async ({ page }) => {
    await page.goto('/calendar');
    // Calendar should display month name
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const currentMonth = months[new Date().getMonth()];
    await expect(page.getByText(new RegExp(currentMonth, 'i')).first()).toBeVisible();
  });

  test('should have view toggle controls', async ({ page }) => {
    await page.goto('/calendar');
    // Should have view options (month, week, day, agenda)
    await expect(page.getByText(/month|week|day/i).first()).toBeVisible();
  });
});
