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

test('production routes survive hard refresh without inventing deployment data', async ({
  page,
}) => {
  const invoiceId = `0x${'11'.repeat(32)}`;

  for (const route of [`/invoices/${invoiceId}`, '/proof/preview']) {
    await page.goto(route);
    await page.reload({ waitUntil: 'networkidle' });
    await expect(page.getByText('Preview mode', { exact: true })).toBeVisible();
  }

  await expect(page.getByText('Illustrative data')).toBeVisible();
});

test('dynamic routes reject malformed invoice IDs', async ({ page }) => {
  for (const route of ['/invoices/not-an-id', '/proof/not-an-id']) {
    await page.goto(route);
    await expect(
      page.getByRole('heading', { name: 'Invalid invoice ID' }),
    ).toBeVisible();
    await expect(page.getByText(/32-byte hexadecimal values/)).toBeVisible();
  }
});

test('primary navigation and actions have visible keyboard focus', async ({
  page,
}) => {
  await page.goto('/');
  await page.keyboard.press('Tab');

  const focusedElement = page.locator(':focus-visible');
  await expect(focusedElement).toBeVisible();

  const focusStyle = await focusedElement.evaluate((element) => {
    const style = getComputedStyle(element);
    return `${style.outlineStyle}:${style.outlineWidth}:${style.boxShadow}`;
  });
  expect(focusStyle).not.toBe('none:0px:none');
});
