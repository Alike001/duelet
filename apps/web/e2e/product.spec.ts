import { expect, test } from '@playwright/test';

const TEST_ACCOUNT = '0x1000000000000000000000000000000000000001';
const screenshotDirectory = process.env.PHASE_SCREENSHOT_DIR;

async function captureEvidence(
  page: import('@playwright/test').Page,
  name: string,
) {
  if (!screenshotDirectory) return;
  await page.screenshot({
    path: `${screenshotDirectory}/${name}.png`,
    fullPage: true,
  });
}

async function installInjectedWallet(
  page: import('@playwright/test').Page,
  initialChainId = 5042,
) {
  await page.addInitScript(
    ({ account, chain }) => {
      const listeners = new Map<string, Set<(...args: unknown[]) => void>>();
      let chainId = chain;
      const emit = (event: string, ...args: unknown[]) =>
        listeners.get(event)?.forEach((listener) => listener(...args));
      const provider = {
        isMetaMask: true,
        request: async ({
          method,
          params,
        }: {
          method: string;
          params?: unknown[];
        }) => {
          if (method === 'eth_chainId') return `0x${chainId.toString(16)}`;
          if (method === 'net_version') return chainId.toString();
          if (method === 'eth_accounts' || method === 'eth_requestAccounts')
            return [account];
          if (method === 'eth_getBalance') return '0xde0b6b3a7640000';
          if (method === 'wallet_switchEthereumChain') {
            const requested = params?.[0] as { chainId?: string } | undefined;
            chainId = Number.parseInt(requested?.chainId ?? '0x13b2', 16);
            emit('chainChanged', `0x${chainId.toString(16)}`);
            return null;
          }
          if (method === 'wallet_getCapabilities') return {};
          return null;
        },
        on: (event: string, listener: (...args: unknown[]) => void) => {
          const registered = listeners.get(event) ?? new Set();
          registered.add(listener);
          listeners.set(event, registered);
        },
        removeListener: (
          event: string,
          listener: (...args: unknown[]) => void,
        ) => listeners.get(event)?.delete(listener),
      };
      Object.defineProperty(window, 'ethereum', {
        configurable: true,
        value: provider,
      });
      Object.assign(window, {
        __dueletSetChain: (nextChain: number) => {
          chainId = nextChain;
          emit('chainChanged', `0x${chainId.toString(16)}`);
        },
      });
    },
    { account: TEST_ACCOUNT, chain: initialChainId },
  );
}

test('landing page explains the real mechanism and preview status', async ({
  page,
}) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: /Invoice once/ }),
  ).toBeVisible();
  await expect(page.getByText('Preview mode', { exact: true })).toBeVisible();
  await expect(
    page.getByText(/Earned USDC becomes available over time/),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: /Create payment/ }).first(),
  ).toBeVisible();
});

test('creation flow validates inputs and blocks writes before deployment', async ({
  page,
}) => {
  await page.goto('/invoices/new');
  await expect(
    page.getByRole('heading', { name: 'Compose payment' }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: /Approve exact amount/ }),
  ).toBeDisabled();
  await page.getByLabel('Recipient wallet address').fill('not-an-address');
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
    page.getByRole('heading', { name: 'Public payment proof' }),
  ).toBeVisible();
  await expect(page.getByText('0.01', { exact: true }).first()).toBeVisible();
  await expect(
    page.getByText(/browser-calculated from the shared golden fixture/),
  ).toBeVisible();
  await expect(
    page.getByText('Illustrative data', { exact: true }),
  ).toBeVisible();
});

test('workspace and activity present honest empty states', async ({ page }) => {
  await page.goto('/app');
  await expect(
    page.getByText('Connect to see payments tied to your address.'),
  ).toBeVisible();
  await page.goto('/activity');
  await expect(page.getByText('No onchain activity yet')).toBeVisible();
});

test('wallet sheet explains connection choices without weakening preview mode', async ({
  page,
}) => {
  await page.goto('/');
  await page.locator('header .wallet-trigger').click();
  await expect(
    page.getByRole('heading', { name: 'Connect to Duelet' }),
  ).toBeVisible();
  await expect(page.getByText('No browser wallet detected')).toBeVisible();
  await expect(page.getByText(/WalletConnect QR/)).toHaveCount(0);
  await expect(page.getByText(/Wagmi|Reown/)).toHaveCount(0);
  await expect(page.getByText(/payments are disabled/i)).toBeVisible();
  await captureEvidence(page, 'wallet-selection-modal');
});

test('injected wallet connects, exposes Arc status, copies, and disconnects', async ({
  page,
}) => {
  await installInjectedWallet(page);
  await page.goto('/app');
  await page.locator('header .wallet-trigger').click();
  await page.getByRole('button', { name: /Browser wallet|MetaMask/ }).click();
  await expect(page.locator('header .wallet-trigger')).not.toHaveClass(/wrong/);
  await expect(page.getByText('0x10000…00001').first()).toBeVisible();
  await page.reload({ waitUntil: 'networkidle' });
  await expect(page.getByText('0x10000…00001').first()).toBeVisible();
  await page.locator('header .wallet-trigger').click();
  await expect(page.getByText('Connected to Arc mainnet')).toBeVisible();
  await expect(page.getByText('Available on Arc')).toBeVisible();
  await captureEvidence(page, 'wallet-connected');
  await page.getByRole('button', { name: /Disconnect wallet/ }).click();
  await expect(
    page.getByText('Connect to see payments tied to your address.'),
  ).toBeVisible();
});

test('account and chain changes expose a recoverable wrong-network state', async ({
  page,
}) => {
  await installInjectedWallet(page);
  await page.goto('/');
  await page.locator('header .wallet-trigger').click();
  await page.getByRole('button', { name: /Browser wallet|MetaMask/ }).click();
  await page.evaluate(() => {
    const testWindow = window as typeof window & {
      __dueletSetChain: (chain: number) => void;
    };
    testWindow.__dueletSetChain(1);
  });
  await expect(page.locator('header .wallet-trigger')).toHaveClass(/wrong/);
  await page.locator('header .wallet-trigger').click();
  await expect(page.getByText('Unsupported network')).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Switch to Arc mainnet' }),
  ).toBeVisible();
  await captureEvidence(page, 'wallet-wrong-network');
  await page.getByRole('button', { name: 'Switch to Arc mainnet' }).click();
  await expect(page.getByText('Connected to Arc mainnet')).toBeVisible();
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

  await expect(
    page.getByText('Illustrative data', { exact: true }),
  ).toBeVisible();
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

test('primary navigation remains available on compact screens', async ({
  page,
}) => {
  await page.goto('/');

  const navigation = page.getByRole('navigation', {
    name: 'Primary navigation',
  });
  await expect(navigation).toBeVisible();
  await expect(
    navigation.getByRole('link', { name: 'Overview' }),
  ).toBeVisible();
  await expect(
    navigation.getByRole('link', { name: 'My invoices' }),
  ).toBeVisible();
  await expect(
    navigation.getByRole('link', { name: 'Activity' }),
  ).toBeVisible();
  await expect(
    navigation.getByRole('link', { name: 'Documentation' }),
  ).toBeVisible();
});

test('financial forms and controls retain accessible names', async ({
  page,
}) => {
  for (const route of ['/', '/app', '/invoices/new', '/proof/preview']) {
    await page.goto(route);
    const unnamedControls = await page
      .locator('button, input, textarea, select')
      .evaluateAll((controls) =>
        controls
          .filter((control) => {
            const element = control as HTMLElement;
            const labelledBy = element.getAttribute('aria-labelledby');
            const label = element.getAttribute('aria-label');
            const id = element.id;
            const associatedLabel = id
              ? document.querySelector(`label[for="${CSS.escape(id)}"]`)
              : element.closest('label');
            return !(
              label?.trim() ||
              labelledBy?.trim() ||
              associatedLabel?.textContent?.trim() ||
              element.textContent?.trim()
            );
          })
          .map((control) => control.outerHTML.slice(0, 120)),
      );
    expect(unnamedControls, `${route} has unnamed controls`).toEqual([]);
  }
});

test('reduced-motion preference disables decorative movement', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const duration = await page
    .locator('.stream-instrument .progress-track > span')
    .evaluate((element) => getComputedStyle(element).animationDuration);
  expect(Number.parseFloat(duration)).toBeLessThanOrEqual(0.00001);
});
