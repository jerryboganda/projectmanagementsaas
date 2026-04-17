import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /sign in|log in/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
  });

  test('should show validation errors on empty submit', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /sign in|log in/i }).click();
    // Expect validation messages
    await expect(page.getByText(/required|invalid/i)).toBeVisible();
  });

  test('should navigate to register page', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('link', { name: /sign up|register|create account/i }).click();
    await expect(page).toHaveURL(/register/);
  });

  test('should navigate to forgot password', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('link', { name: /forgot/i }).click();
    await expect(page).toHaveURL(/forgot-password/);
  });
});
