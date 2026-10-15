import { describe, expect, it, vi } from 'vitest';

const rpc = vi.hoisted(() => ({
  getBlockNumber: vi.fn(),
  getContractEvents: vi.fn(),
  getBlock: vi.fn(),
}));
vi.mock('viem', async (original) => ({
  ...(await original<typeof import('viem')>()),
  createPublicClient: () => rpc,
}));
vi.mock('@/lib/chain', () => ({
  arc: {},
  deployment: {
    address: '0x1000000000000000000000000000000000000001',
    block: 100n,
  },
}));
import { loadActivity } from '@/lib/events';

describe('bounded event discovery', () => {
  it('reads all lifecycle events once per block range, orders and deduplicates them', async () => {
    rpc.getBlockNumber.mockResolvedValue(10100n);
    const id = `0x${'11'.repeat(32)}`;
    const base = {
      transactionHash: `0x${'22'.repeat(32)}`,
      blockNumber: 200n,
      args: {
        invoiceId: id,
        payer: 'payer',
        payee: 'payee',
        caller: 'caller',
        totalAmount: 10000n,
        amount: 3000n,
        refundedAmount: 7000n,
      },
    };
    rpc.getContractEvents
      .mockResolvedValueOnce([
        { ...base, eventName: 'InvoiceCreated', logIndex: 0 },
        { ...base, eventName: 'FundsWithdrawn', logIndex: 1 },
        { ...base, eventName: 'InvoiceCanceled', logIndex: 2 },
        { ...base, eventName: 'InvoiceCreated', logIndex: 0 },
      ])
      .mockResolvedValueOnce([]);
    rpc.getBlock.mockResolvedValue({ timestamp: 12345n });
    const events = await loadActivity();
    expect(rpc.getContractEvents).toHaveBeenCalledTimes(2);
    expect(rpc.getContractEvents.mock.calls[0][0]).toMatchObject({
      fromBlock: 100n,
      toBlock: 10098n,
    });
    expect(rpc.getContractEvents.mock.calls[1][0]).toMatchObject({
      fromBlock: 10099n,
      toBlock: 10100n,
    });
    expect(events.map((event) => event.type)).toEqual([
      'canceled',
      'withdrawn',
      'created',
    ]);
    expect(events.map((event) => event.amount)).toEqual([7000n, 3000n, 10000n]);
    expect(events.every((event) => event.timestamp === 12345n)).toBe(true);
    expect(rpc.getBlock).toHaveBeenCalledTimes(1);
  });
});
