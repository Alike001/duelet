type ProviderFlags = {
  isMetaMask?: boolean;
  isRabby?: boolean;
  isBraveWallet?: boolean;
  isCoinbaseWallet?: boolean;
};

export function isValidReownProjectId(value: string | undefined): boolean {
  return /^[a-f0-9]{32}$/i.test(value?.trim() ?? '');
}

export function walletDisplayName(
  connectorName: string,
  provider: unknown,
): string {
  if (connectorName !== 'Injected') return connectorName;

  const flags = (provider ?? {}) as ProviderFlags;
  if (flags.isRabby) return 'Rabby Wallet';
  if (flags.isBraveWallet) return 'Brave Wallet';
  if (flags.isCoinbaseWallet) return 'Coinbase Wallet';
  if (flags.isMetaMask) return 'MetaMask';
  return 'Browser wallet';
}

export function walletIdentityKey(
  name: string,
  rdns?: string | readonly string[],
) {
  if (name === 'MetaMask') return 'io.metamask';
  if (name === 'Rabby Wallet') return 'io.rabby';
  return rdns?.toString() ?? name.toLowerCase();
}

export function walletErrorMessage(
  error: unknown,
  action: 'connect' | 'switch' = 'connect',
): string {
  const candidate = error as
    | { code?: number; message?: string; name?: string; shortMessage?: string }
    | undefined;
  const detail =
    candidate?.shortMessage?.trim() || candidate?.message?.trim() || '';
  const rejected =
    candidate?.code === 4001 ||
    /reject|denied|cancelled|canceled|user rejected/i.test(
      `${candidate?.name ?? ''} ${detail}`,
    );

  if (rejected) {
    return action === 'switch'
      ? 'Network switch canceled. You can try again when ready.'
      : 'Wallet connection canceled. No account was connected.';
  }

  if (/already pending|request.*pending/i.test(detail)) {
    return 'A wallet request is already open. Complete or cancel it in your wallet.';
  }

  if (/expired|session.*(closed|deleted)|pairing.*expired/i.test(detail)) {
    return 'The wallet session expired. Start a new connection and scan the new QR code.';
  }

  return action === 'switch'
    ? 'Could not switch networks. Open your wallet and select Arc mainnet.'
    : 'Could not connect this wallet. Check the wallet and try again.';
}
