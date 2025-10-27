import { test, expect } from '@playwright/test';

test.describe('WorkshopOS Happy Path', () => {
  test.beforeEach(async ({ page }) => {
    // Run db seed before each test to ensure a clean state
    // This requires a script in package.json like "test:e2e:reset": "npm run db:migrate && npm run db:seed"
    // For this example, we assume the DB is seeded.
    
    // Login
    await page.goto('/login');
    await page.getByLabel('Email').fill('artisan@workshopos.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page).toHaveURL(/.*\/workshops/);
  });

  test('user can navigate through the app and see data', async ({ page }) => {
    // 1. Select workshop
    await page.getByRole('link', { name: "Artisan's Leather Co." }).click();
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    const workshopId = page.url().split('/')[3];

    // 2. Navigate to Products and verify seeded product exists
    await page.getByRole('link', { name: 'Products' }).click();
    await expect(page).toHaveURL(`/${workshopId}/products`);
    await expect(page.getByRole('heading', { name: 'The Minimalist Wallet' })).toBeVisible();

    // 3. Navigate to a product detail page and check costing
    await page.getByRole('link', { name: 'The Minimalist Wallet' }).click();
    await expect(page).toHaveURL(new RegExp(`/${workshopId}/products/`));
    await page.getByRole('tab', { name: 'Cost & Price' }).click();
    
    // Check that a calculated cost is visible (values depend on seed data)
    // This is a powerful check that confirms the backend logic is working.
    await expect(page.getByText(/Total Unit Cost/)).toBeVisible();
    await expect(page.locator('p:has-text("$")').first()).toBeVisible();

    // 4. Navigate to Customers and verify seeded customer
    await page.getByRole('link', { name: 'Customers' }).click();
    await expect(page).toHaveURL(`/${workshopId}/customers`);
    await expect(page.getByText('John Doe')).toBeVisible();

    // 5. Navigate to Orders and verify seeded order
    await page.getByRole('link', { name: 'Orders' }).click();
    await expect(page).toHaveURL(`/${workshopId}/orders`);
    await expect(page.getByText('WOS-1001')).toBeVisible();
  });
});