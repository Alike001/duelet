import { describe, expect, it } from 'vitest';
import { activityForWallet, invoicesForWallet } from '@/lib/activity-scope';
import type { DueletActivity } from '@/lib/events';

const payer = '0x10000000000000000000000000000000000000AA';
const payee = '0x20000000000000000000000000000000000000BB';
const stranger = '0x30000000000000000000000000000000000000CC';
const invoiceId = `0x${'11'.repeat(32)}` as const;
const otherId = `0x${'22'.repeat(32)}` as const;
const funded: DueletActivity = {
  key: 'funded',
  type: 'created',
  invoiceId,
  payer,
  payee,
  amount: 10000n,
  blockNumber: 1n,
  logIndex: 0,
  transactionHash: invoiceId,
};
const claim: DueletActivity = {
  ...funded,
  key: 'claimed',
  type: 'withdrawn',
  payer: undefined,
  caller: stranger,
  blockNumber: 2n,
};
const other: DueletActivity = {
  ...funded,
  key: 'other',
  invoiceId: otherId,
  payer: stranger,
  payee: stranger,
};
const events = [claim, other, funded];

describe('personal payment scope', () => {
  it('includes payer and recipient invoices without exposing unrelated invoices in All', () => {
    expect(invoicesForWallet(events, payer.toLowerCase())).toEqual([funded]);
    expect(invoicesForWallet(events, payee.toLowerCase())).toEqual([funded]);
    expect(invoicesForWallet(events, stranger)).toEqual([other]);
  });
  it('keeps third-party claims in the invoice participants activity, not the callers personal invoice list', () => {
    expect(activityForWallet(events, payer)).toEqual([claim, funded]);
    expect(activityForWallet(events, payee)).toEqual([claim, funded]);
    expect(activityForWallet(events, stranger)).toEqual([other]);
  });
  it('clears personal views on disconnect or account change and deduplicates creation logs', () => {
    expect(activityForWallet(events)).toEqual([]);
    expect(invoicesForWallet(events)).toEqual([]);
    expect(invoicesForWallet([...events, funded], payer)).toEqual([funded]);
    expect(
      activityForWallet(events, '0x4000000000000000000000000000000000000000'),
    ).toEqual([]);
  });
});
