import { describe, expect, it } from 'vitest';

import { formatUsdc, parseUsdc, reconcile, vestedAt } from '@/lib/finance';

const invoice = {
  totalAmount: 10_000n,
  withdrawnAmount: 1_000n,
  refundedAmount: 0n,
  startTime: 1_000n,
  endTime: 1_180n,
  canceledAt: 0n,
};

describe('Duelet financial presentation', () => {
  it('matches the golden fixture at 18 and 60 seconds', () => {
    expect(vestedAt({ ...invoice, withdrawnAmount: 0n }, 1_018n)).toBe(1_000n);
    expect(reconcile(invoice, 1_060n)).toEqual({
      vested: 3_333n,
      claimable: 2_333n,
      refundable: 6_667n,
      liability: 9_000n,
    });
  });

  it('freezes vesting at cancellation and reconciles zero after final claim', () => {
    const canceled = {
      ...invoice,
      withdrawnAmount: 3_333n,
      refundedAmount: 6_667n,
      canceledAt: 1_060n,
    };
    expect(reconcile(canceled, 2_000n)).toEqual({
      vested: 3_333n,
      claimable: 0n,
      refundable: 0n,
      liability: 0n,
    });
  });

  it('parses and formats six-decimal USDC without floating point', () => {
    expect(parseUsdc('0.010000')).toBe(10_000n);
    expect(formatUsdc(10_000n)).toBe('0.01');
    expect(() => parseUsdc('1.0000001')).toThrow(/6 decimals/);
  });

  it('does not advance across equal timestamps', () => {
    expect(vestedAt(invoice, 1_060n)).toBe(vestedAt(invoice, 1_060n));
  });
});
