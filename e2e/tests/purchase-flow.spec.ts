import { test, expect } from '@playwright/test';

/**
 * E2E: Customer Portal purchase flow.
 * Requires: npm run start:backend + npm run start:frontend running.
 */
test.describe('Customer Portal — Purchase Flow', () => {
  test('login → browse products → purchase → verify in history', async ({ page }) => {
    // 1. Go to login page
    await page.goto('/');

    // 2. Click on a demo account to fill email
    await page.getByText('Alice Johnson').click();

    // 3. Click Continue
    await page.getByRole('button', { name: 'Continue' }).click();

    // 4. Enter access code
    await page.getByPlaceholder('Enter 6-digit code...').fill('123456');

    // 5. Click Sign In
    await page.getByRole('button', { name: 'Sign In' }).click();

    // 6. Should be on the home page with products
    await expect(page.getByText('Products')).toBeVisible();

    // 7. Wait for products to load and click on a product
    const productCard = page.getByText('ErgoMouse X1').first();
    await expect(productCard).toBeVisible({ timeout: 10000 });
    await productCard.click();

    // 8. On the product page, click Buy Now / Purchase
    const buyButton = page.getByRole('button', { name: /buy|purchase/i }).first();
    await expect(buyButton).toBeVisible({ timeout: 5000 });
    await buyButton.click();

    // 9. Wait for purchase confirmation
    await expect(page.getByText(/order|purchase|confirmed|success/i).first()).toBeVisible({ timeout: 10000 });

    // 10. Navigate to purchase history
    await page.getByText(/history|orders/i).first().click();

    // 11. Verify the purchase appears in the list
    await expect(page.getByText('ErgoMouse').first()).toBeVisible({ timeout: 5000 });
  });
});
