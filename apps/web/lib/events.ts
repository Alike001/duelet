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
const RANGE = 25_000n;
const CONFIRMATION_DEPTH = 20n;

export async function loadActivity(): Promise<DueletActivity[]> {
  if (!deployment.address || deployment.block === undefined) return [];
  const latest = await client.getBlockNumber();
  if (latest < deployment.block + CONFIRMATION_DEPTH) return [];
  const confirmedLatest = latest - CONFIRMATION_DEPTH;
  const all: DueletActivity[] = [];

  for (let from = deployment.block; from <= confirmedLatest; from += RANGE) {
    const to =
      from + RANGE - 1n > confirmedLatest ? confirmedLatest : from + RANGE - 1n;
    const [created, withdrawn, canceled] = await Promise.all([
      client.getContractEvents({
        address: deployment.address,
        abi: dueletAbi,
        eventName: 'InvoiceCreated',
        fromBlock: from,
        toBlock: to,
        strict: true,
      }),
      client.getContractEvents({
        address: deployment.address,
        abi: dueletAbi,
        eventName: 'FundsWithdrawn',
        fromBlock: from,
        toBlock: to,
        strict: true,
      }),
      client.getContractEvents({
        address: deployment.address,
        abi: dueletAbi,
        eventName: 'InvoiceCanceled',
        fromBlock: from,
        toBlock: to,
        strict: true,
      }),
    ]);
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
