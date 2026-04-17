import { test, expect } from '@playwright/test';

test.describe('Accessibility', () => {
  test('should have lang attribute on html', async ({ page }) => {
    await page.goto('/');
    const lang = await page.locator('html').getAttribute('lang');
    expect(lang).toBe('en');
  });

  test('should have skip to content link', async ({ page }) => {
    await page.goto('/');
    const skipLink = page.locator('a[href="#main-content"]');
    await expect(skipLink).toBeAttached();
  });

  test('should have focus-visible styles', async ({ page }) => {
    await page.goto('/');
    // Tab to first interactive element
    await page.keyboard.press('Tab');
    // The focused element should have outline
    const focusedElement = page.locator(':focus-visible');
    await expect(focusedElement).toBeVisible();
  });

  test('all images should have alt text', async ({ page }) => {
    await page.goto('/');
    const images = page.locator('img');
    const count = await images.count();
    for (let i = 0; i < count; i++) {
      const alt = await images.nth(i).getAttribute('alt');
      expect(alt, `Image ${i} missing alt text`).toBeTruthy();
    }
  });
});
