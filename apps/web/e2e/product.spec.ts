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
  rejectConnection = false,
) {
  await page.addInitScript(
    ({ account, chain, reject }) => {
      const listeners = new Map<string, Set<(...args: unknown[]) => void>>();
      let chainId = chain;
      let selectedAccount = account;
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
          if (method === 'eth_accounts') {
            return localStorage.getItem('duelet-test-wallet-authorized') ===
              'yes'
              ? [selectedAccount]
              : [];
          }
          if (method === 'eth_requestAccounts') {
            if (reject) {
              throw Object.assign(new Error('User rejected the request.'), {
                code: 4001,
              });
            }
            localStorage.setItem('duelet-test-wallet-authorized', 'yes');
            return [selectedAccount];
          }
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
        __dueletSetAccount: (nextAccount: string) => {
          selectedAccount = nextAccount;
          emit('accountsChanged', [selectedAccount]);
        },
      });
    },
    { account: TEST_ACCOUNT, chain: initialChainId, reject: rejectConnection },
  );
}

async function installEip6963Wallets(page: import('@playwright/test').Page) {
  await page.addInitScript(
    ({ account }) => {
      const makeProvider = (flags: Record<string, boolean>) => ({
        ...flags,
        request: async ({ method }: { method: string }) => {
          if (method === 'eth_chainId') return '0x13b2';
          if (method === 'net_version') return '5042';
          if (method === 'eth_accounts') return [];
          if (method === 'eth_requestAccounts') return [account];
          if (method === 'eth_getBalance') return '0xde0b6b3a7640000';
          if (method === 'wallet_getCapabilities') return {};
          return null;
        },
        on: () => undefined,
        removeListener: () => undefined,
      });
      const providers = [
        {
          info: {
            uuid: '00000000-0000-4000-8000-000000000001',
            name: 'MetaMask',
            icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>',
            rdns: 'io.metamask',
          },
          provider: makeProvider({ isMetaMask: true }),
        },
        {
          info: {
            uuid: '00000000-0000-4000-8000-000000000002',
            name: 'Rabby Wallet',
            icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>',
            rdns: 'io.rabby',
          },
          provider: makeProvider({ isRabby: true }),
        },
      ];
      Object.defineProperty(window, 'ethereum', {
        configurable: true,
        value: providers[0].provider,
      });
      const announce = () =>
        providers.forEach((detail) =>
          window.dispatchEvent(
            new CustomEvent('eip6963:announceProvider', { detail }),
          ),
        );
      window.addEventListener('eip6963:requestProvider', announce);
    },
    { account: TEST_ACCOUNT },
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
  await expect(page.getByRole('link', { name: 'Get MetaMask' })).toBeVisible();
  await expect(
    page.getByRole('button', { name: /WalletConnect/ }),
  ).toBeVisible();
  await expect(page.getByText(/Wagmi|Reown/)).toHaveCount(0);
  await expect(page.getByText(/payments are disabled/i)).toBeVisible();
  await captureEvidence(page, 'wallet-selection-modal');
});

test('WalletConnect initializes a genuine responsive session', async ({
  page,
}, testInfo) => {
  await page.goto('/');
  await page.locator('header .wallet-trigger').click();
  await page.getByRole('button', { name: /WalletConnect/ }).click();
  await expect(page.locator('.wallet-dialog')).not.toBeVisible();
  await expect(page.locator('w3m-modal')).toBeVisible({ timeout: 15_000 });
  if (testInfo.project.name === 'mobile-chrome') {
    await expect(page.getByRole('alertdialog')).toBeVisible();
    await expect(page.getByRole('button', { name: /MetaMask/ })).toBeVisible();
  } else {
    await expect(
      page.getByText('Scan this QR Code with your phone'),
    ).toBeVisible({ timeout: 15_000 });
    await expect(
      page.getByRole('button', { name: /Search Wallet/ }),
    ).toBeVisible();
  }
  await captureEvidence(page, 'walletconnect-qr');
});

test('EIP-6963 discovery presents multiple real browser wallets once', async ({
  page,
}) => {
  await installEip6963Wallets(page);
  await page.goto('/');
  await page.locator('header .wallet-trigger').click();
  await expect(page.getByRole('button', { name: /MetaMask/ })).toHaveCount(1);
  await expect(page.getByRole('button', { name: /Rabby Wallet/ })).toHaveCount(
    1,
  );
  await expect(page.getByText('Browser wallet', { exact: true })).toHaveCount(
    0,
  );
  await captureEvidence(page, 'wallet-multiple-providers');
});

test('wallet rejection stays disconnected and shows a human message', async ({
  page,
}) => {
  await installInjectedWallet(page, 5042, true);
  await page.goto('/');
  await page.locator('header .wallet-trigger').click();
  await page.getByRole('button', { name: /MetaMask/ }).click();
  await expect(page.locator('.wallet-error')).toHaveText(
    'Wallet connection canceled. No account was connected.',
  );
  await expect(page.locator('header .wallet-trigger')).toContainText('Connect');
});

test('wallet dialog closes with Escape and returns focus to its trigger', async ({
  page,
}) => {
  await page.goto('/');
  const trigger = page.locator('header .wallet-trigger');
  await trigger.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(trigger).toBeFocused();
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
  await expect(
    page.getByText('MetaMask · Connected to Arc mainnet'),
  ).toBeVisible();
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
      __dueletSetAccount: (account: string) => void;
    };
    testWindow.__dueletSetAccount('0x2000000000000000000000000000000000000002');
  });
  await expect(page.locator('header .wallet-trigger')).toContainText(
    '0x20000…00002',
  );
  await page.evaluate(() => {
    const testWindow = window as typeof window & {
      __dueletSetChain: (chain: number) => void;
    };
    testWindow.__dueletSetChain(1);
  });
  await expect(page.locator('header .wallet-trigger')).toHaveClass(/wrong/);
  await page.locator('header .wallet-trigger').click();
  await expect(page.getByText('MetaMask · Unsupported network')).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Switch to Arc mainnet' }),
  ).toBeVisible();
  await captureEvidence(page, 'wallet-wrong-network');
  await page.getByRole('button', { name: 'Switch to Arc mainnet' }).click();
  await expect(
    page.getByText('MetaMask · Connected to Arc mainnet'),
  ).toBeVisible();
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
