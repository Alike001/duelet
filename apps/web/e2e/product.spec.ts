import { expect, test } from '@playwright/test';

test('landing page explains the real mechanism and preview status', async ({
  page,
}) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: /Invoice once/ }),
  ).toBeVisible();
  await expect(page.getByText('Preview mode', { exact: true })).toBeVisible();
  await expect(
    page.getByText(/Claims are triggered transactions/),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: /Create an invoice/ }).first(),
  ).toBeVisible();
});

test('creation flow validates inputs and blocks writes before deployment', async ({
  page,
}) => {
  await page.goto('/invoices/new');
  await expect(
    page.getByRole('heading', { name: 'Create invoice' }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: /Approve exact amount/ }),
  ).toBeDisabled();
  await page.getByLabel('Payee wallet address').fill('not-an-address');
  await expect(page.getByText('Enter a valid payee address.')).toBeVisible();
  await expect(
    page.getByText(/No transaction is available until/),
  ).toBeVisible();
});

test('illustrative proof reconciles without claiming onchain evidence', async ({
  page,
}) => {
  await page.goto('/proof/preview');
  await expect(
    page.getByRole('heading', { name: 'Invoice proof' }),
  ).toBeVisible();
  await expect(page.getByText('0.01', { exact: true }).first()).toBeVisible();
  await expect(
    page.getByText(/browser-calculated from the shared golden fixture/),
  ).toBeVisible();
  await expect(page.getByText('Illustrative data')).toBeVisible();
});

test('workspace and activity present honest empty states', async ({ page }) => {
  await page.goto('/app');
  await expect(
    page.getByText('Connect a wallet to find your invoices.'),
  ).toBeVisible();
  await page.goto('/activity');
  await expect(page.getByText('No onchain activity yet')).toBeVisible();
});

test('all primary routes navigate without horizontal overflow', async ({
  page,
}) => {
  for (const route of [
    '/',
    '/app',
    '/invoices',
    '/invoices/new',
    '/activity',
    '/proof/preview',
    '/docs',
  ]) {
    await page.goto(route);
    const overflows = await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth + 1,
    );
    expect(overflows, `${route} should not overflow`).toBe(false);
  }
});
