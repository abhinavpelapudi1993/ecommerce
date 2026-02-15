import { test, expect } from '@playwright/test';

/**
 * E2E: Support Dashboard login and navigation.
 * Requires: npm run start:backend + npm run start:frontend running.
 */
test.describe('Support Dashboard', () => {
  test.use({ baseURL: 'http://localhost:5174' });

  test('login → view dashboard → navigate sections', async ({ page }) => {
    // 1. Go to support dashboard login
    await page.goto('/');

    // 2. Click on a support user to fill email
    await page.getByText('Sarah Support').click();

    // 3. Click Continue
    await page.getByRole('button', { name: 'Continue' }).click();

    // 4. Enter access code
    await page.getByPlaceholder('Enter 6-digit code...').fill('123456');

    // 5. Click Sign In
    await page.getByRole('button', { name: 'Sign In' }).click();

    // 6. Should see the dashboard with welcome message
    await expect(page.getByText(/Welcome back, Sarah Support/)).toBeVisible({ timeout: 5000 });

    // 7. Verify navigation cards are present
    await expect(page.getByText('Customers')).toBeVisible();
    await expect(page.getByText('Products')).toBeVisible();
    await expect(page.getByText('Refund Requests')).toBeVisible();

    // 8. Navigate to Customers page
    await page.getByText('Customers').click();
    await expect(page.getByText(/customer/i).first()).toBeVisible({ timeout: 5000 });
  });
});
