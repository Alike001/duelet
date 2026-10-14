import { describe, expect, it } from 'vitest';

import { dueletAbi } from '@/lib/abi';
import { ARC_CHAIN_ID, ARC_USDC_ADDRESS, deployment } from '@/lib/chain';

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
});
