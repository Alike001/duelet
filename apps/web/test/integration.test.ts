import { describe, expect, it } from 'vitest';

import { dueletAbi } from '@/lib/abi';
import { ARC_CHAIN_ID, ARC_USDC_ADDRESS, deployment } from '@/lib/chain';
import { DUELET_ARC_RUNTIME_CODEHASH } from '@/lib/chain';
import { deploymentIdentityMatches } from '@/lib/deployment-verification';
import { EVENT_LOG_RANGE } from '@/lib/events';

describe('Arc and ABI integration', () => {
  it('uses verified Arc configuration and explicit preview mode', () => {
    expect(ARC_CHAIN_ID).toBe(5042);
    expect(ARC_USDC_ADDRESS).toBe('0x3600000000000000000000000000000000000000');
    expect(deployment.mode).toBe('preview');
    expect(deployment.address).toBeUndefined();
  });

  it('exposes every required contract lifecycle function', () => {
    const names = dueletAbi
      .filter((item) => item.type === 'function')
      .map((item) => item.name);
    expect(names).toEqual(
      expect.arrayContaining([
        'createAndFund',
        'withdraw',
        'cancel',
        'getInvoice',
        'vestedAmount',
        'claimableAmount',
        'refundableAmount',
        'invoiceLiability',
        'invoiceStatus',
      ]),
    );
  });

  it('exposes every reconciliation event', () => {
    const names = dueletAbi
      .filter((item) => item.type === 'event')
      .map((item) => item.name);
    expect(names).toEqual([
      'InvoiceCreated',
      'FundsWithdrawn',
      'InvoiceCanceled',
    ]);
  });

  it('locks writes unless bytecode and immutable USDC both match', () => {
    expect(
      deploymentIdentityMatches(DUELET_ARC_RUNTIME_CODEHASH, ARC_USDC_ADDRESS),
    ).toBe(true);
    expect(
      deploymentIdentityMatches(`0x${'00'.repeat(32)}`, ARC_USDC_ADDRESS),
    ).toBe(false);
    expect(
      deploymentIdentityMatches(
        DUELET_ARC_RUNTIME_CODEHASH,
        '0x0000000000000000000000000000000000000001',
      ),
    ).toBe(false);
  });

  it('keeps event discovery within the Arc public RPC log limit', () => {
    expect(EVENT_LOG_RANGE).toBe(9_999n);
    expect(EVENT_LOG_RANGE).toBeLessThanOrEqual(10_000n);
  });
});
