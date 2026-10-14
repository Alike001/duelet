import { describe, expect, it } from 'vitest';

import {
  formatUsdc,
  hasExactApproval,
  illustrativeInvoiceAt,
  nextIllustrativeElapsed,
  parseUsdc,
  reconcile,
  vestedAt,
} from '@/lib/finance';

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
    expect(formatUsdc(12_345_678_901_234_567_890_123_456n)).toBe(
      '12,345,678,901,234,567,890.123456',
    );
  });

  it('does not advance across equal timestamps', () => {
    expect(vestedAt(invoice, 1_060n)).toBe(vestedAt(invoice, 1_060n));
  });

  it('requires an exact allowance and rejects residual authority', () => {
    expect(hasExactApproval(10_000n, 10_000n)).toBe(true);
    expect(hasExactApproval(9_999n, 10_000n)).toBe(false);
    expect(hasExactApproval(10_001n, 10_000n)).toBe(false);
    expect(hasExactApproval(undefined, 10_000n)).toBe(false);
  });

  it('keeps every animated illustration frame financially possible', () => {
    for (let elapsed = 0n; elapsed <= 180n; elapsed += 1n) {
      const frame = illustrativeInvoiceAt(elapsed);
      const accounting = reconcile(frame, elapsed);

      expect(frame.withdrawnAmount).toBeLessThanOrEqual(accounting.vested);
      expect(accounting.claimable).toBeGreaterThanOrEqual(0n);
      expect(
        frame.withdrawnAmount + frame.refundedAmount + accounting.liability,
      ).toBe(frame.totalAmount);
      expect(accounting.vested).toBe(
        (frame.totalAmount * elapsed) / (frame.endTime - frame.startTime),
      );
    }

    expect(illustrativeInvoiceAt(0n).withdrawnAmount).toBe(0n);
    expect(illustrativeInvoiceAt(17n).withdrawnAmount).toBe(0n);
    expect(illustrativeInvoiceAt(18n).withdrawnAmount).toBe(1_000n);
    expect(reconcile(illustrativeInvoiceAt(0n), 0n).claimable).toBe(0n);

    const resetElapsed = nextIllustrativeElapsed(180n);
    const resetFrame = illustrativeInvoiceAt(resetElapsed);
    const resetAccounting = reconcile(resetFrame, resetElapsed);
    expect(resetElapsed).toBe(0n);
    expect(resetFrame.withdrawnAmount).toBeLessThanOrEqual(
      resetAccounting.vested,
    );
    expect(resetAccounting.claimable).toBeGreaterThanOrEqual(0n);
  });
});
