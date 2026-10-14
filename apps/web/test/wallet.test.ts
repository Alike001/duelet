import { describe, expect, it } from 'vitest';

import {
  walletDisplayName,
  walletErrorMessage,
  walletIdentityKey,
} from '@/lib/wallet';

describe('wallet presentation', () => {
  it('identifies common injected providers without renaming EIP-6963 wallets', () => {
    expect(walletDisplayName('Injected', { isMetaMask: true })).toBe(
      'MetaMask',
    );
    expect(walletDisplayName('Injected', { isRabby: true })).toBe(
      'Rabby Wallet',
    );
    expect(walletDisplayName('Frame', {})).toBe('Frame');
    expect(walletDisplayName('Injected', {})).toBe('Browser wallet');
  });

  it('deduplicates legacy and EIP-6963 identities for the same wallet', () => {
    expect(walletIdentityKey('MetaMask')).toBe(
      walletIdentityKey('MetaMask', 'io.metamask'),
    );
    expect(walletIdentityKey('Rabby Wallet')).toBe(
      walletIdentityKey('Rabby Wallet', 'io.rabby'),
    );
  });

  it('turns rejection and pending errors into safe, useful messages', () => {
    expect(walletErrorMessage({ code: 4001 })).toMatch(/canceled/);
    expect(
      walletErrorMessage({ message: 'User rejected the request.' }, 'switch'),
    ).toMatch(/Network switch canceled/);
    expect(
      walletErrorMessage({
        message: 'Request of type wallet_requestPermissions already pending',
      }),
    ).toMatch(/already open/);
    expect(walletErrorMessage(new Error('private RPC detail'))).not.toMatch(
      /private RPC detail/,
    );
  });
});
