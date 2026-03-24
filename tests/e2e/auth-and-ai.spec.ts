import { expect, test, type Page } from '@playwright/test';

function uniqueUser() {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return {
    fullName: 'Playwright E2E',
    email: `playwright-${suffix}@example.com`,
    password: 'StrongPass123',
  };
}

async function registerAndLandOnDashboard(page: Page) {
  const user = uniqueUser();

  await page.addInitScript(() => {
    window.localStorage.setItem('onboarding-completed', 'true');
  });
  await page.goto('/register');
  await page.getByLabel(/^Full name/).fill(user.fullName);
  await page.getByLabel(/^Work email/).fill(user.email);
  await page.getByLabel(/^Password/).fill(user.password);
  await page.getByLabel(/^Confirm password/).fill(user.password);
  await page.getByRole('button', { name: 'Create account' }).click();

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();

  return user;
}

test.describe('auth and AI provider flows', () => {
  test('redirects anonymous users to login with a preserved target', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('onboarding-completed', 'true');
    });
    await page.goto('/settings');

    await expect(page).toHaveURL(/\/login\?redirect=%2Fsettings/);
    await expect(page.getByRole('heading', { name: 'Sign in to your workspace' })).toBeVisible();
  });

  test('registers a new account and can save then remove an AI provider', async ({ page }) => {
    await registerAndLandOnDashboard(page);

    await page.goto('/settings');
    await page.getByRole('button', { name: 'Integrations' }).click();
    const aiProviderSection = page.locator('section').filter({
      has: page.getByRole('heading', { name: 'AI Provider' }),
    });

    await expect(page.getByRole('heading', { name: 'Integrations' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'AI Provider' })).toBeVisible();

    await page.getByLabel(/^Provider Name/).fill('OpenAI-Compatible');
    await page.getByLabel(/^Model/).fill('gpt-4.1-mini');
    await page.getByLabel(/^Base URL/).fill('https://api.openai.com/v1');
    await page.getByLabel(/^API Key/).fill('sk-test-playwright-key');

    await page.getByRole('button', { name: 'Save AI Provider' }).click();

    await expect(page.getByText('AI provider saved. AI Copilot can use it immediately.')).toBeVisible();
    await expect(aiProviderSection.getByText('Connected')).toBeVisible();
    await expect(aiProviderSection.getByText(/Stored ending in/i)).toBeVisible();

    await page.getByRole('button', { name: 'Remove Provider' }).click();

    await expect(page.getByText('AI provider removed.')).toBeVisible();
    await expect(aiProviderSection.getByText('Not Connected')).toBeVisible();
  });
});
