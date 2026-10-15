import { createPublicClient, http, type Address, type Hex } from 'viem';

import { dueletAbi } from './abi';
import { arc, deployment } from './chain';

export type DueletActivity = {
  key: string;
  type: 'created' | 'withdrawn' | 'canceled';
  invoiceId: Hex;
  referenceHash?: Hex;
  amount: bigint;
  payer?: Address;
  payee?: Address;
  caller?: Address;
  blockNumber: bigint;
  logIndex: number;
  transactionHash: Hex;
  timestamp?: bigint;
};

const client = createPublicClient({ chain: arc, transport: http() });
// Arc public RPC currently caps eth_getLogs queries at 10,000 blocks.
// Staying one block below that ceiling leaves the request unambiguous across
// providers that interpret the limit as an exclusive range.
export const EVENT_LOG_RANGE = 9_999n;
// Arc blocks are deterministically final when committed. Its official indexer
// guidance explicitly removes confirmation-depth delays, so finalized event
// discovery can include the current committed head.
export const EVENT_CONFIRMATION_DEPTH = 0n;

export function eventUpperBound(
  latest: bigint,
  deploymentBlock: bigint,
): bigint | undefined {
  return latest < deploymentBlock ? undefined : latest;
}

export async function loadActivity(): Promise<DueletActivity[]> {
  if (!deployment.address || deployment.block === undefined) return [];
  const latest = await client.getBlockNumber();
  const confirmedLatest = eventUpperBound(latest, deployment.block);
  if (confirmedLatest === undefined) return [];
  const all: DueletActivity[] = [];

  for (
    let from = deployment.block;
    from <= confirmedLatest;
    from += EVENT_LOG_RANGE
  ) {
    const to =
      from + EVENT_LOG_RANGE - 1n > confirmedLatest
        ? confirmedLatest
        : from + EVENT_LOG_RANGE - 1n;
    // One contract-wide query retrieves all three event types. Separate
    // requests per event triple the public RPC load on every page visit.
    const logs = await client.getContractEvents({
      address: deployment.address,
      abi: dueletAbi,
      fromBlock: from,
      toBlock: to,
      strict: true,
    });
    const created = logs.filter((log) => log.eventName === 'InvoiceCreated');
    const withdrawn = logs.filter((log) => log.eventName === 'FundsWithdrawn');
    const canceled = logs.filter((log) => log.eventName === 'InvoiceCanceled');
    for (const log of created)
      all.push({
        key: `${log.transactionHash}-${log.logIndex}`,
        type: 'created',
        invoiceId: log.args.invoiceId,
        referenceHash: log.args.referenceHash,
        amount: log.args.totalAmount,
        payer: log.args.payer,
        payee: log.args.payee,
        blockNumber: log.blockNumber,
        logIndex: log.logIndex,
        transactionHash: log.transactionHash,
      });
    for (const log of withdrawn)
      all.push({
        key: `${log.transactionHash}-${log.logIndex}`,
        type: 'withdrawn',
        invoiceId: log.args.invoiceId,
        amount: log.args.amount,
        payee: log.args.payee,
        caller: log.args.caller,
        blockNumber: log.blockNumber,
        logIndex: log.logIndex,
        transactionHash: log.transactionHash,
      });
    for (const log of canceled)
      all.push({
        key: `${log.transactionHash}-${log.logIndex}`,
        type: 'canceled',
        invoiceId: log.args.invoiceId,
        amount: log.args.refundedAmount,
        payer: log.args.payer,
        payee: log.args.payee,
        blockNumber: log.blockNumber,
        logIndex: log.logIndex,
        transactionHash: log.transactionHash,
      });
  }

  const deduped = [...new Map(all.map((item) => [item.key, item])).values()];
  deduped.sort(
    (a, b) => Number(b.blockNumber - a.blockNumber) || b.logIndex - a.logIndex,
  );
  const blocks = [
    ...new Set(deduped.map((item) => item.blockNumber.toString())),
  ];
  const timestamps = new Map<string, bigint>();
  await Promise.all(
    blocks.map(async (number) => {
      const block = await client.getBlock({ blockNumber: BigInt(number) });
      timestamps.set(number, block.timestamp);
    }),
  );
  return deduped.map((item) => ({
    ...item,
    timestamp: timestamps.get(item.blockNumber.toString()),
  }));
}

export function activityForInvoice(
  activity: DueletActivity[],
  invoiceId: string,
) {
  return activity.filter(
    (item) => item.invoiceId.toLowerCase() === invoiceId.toLowerCase(),
  );
}
