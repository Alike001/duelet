import { formatUnits, parseUnits } from 'viem';

export const USDC_DECIMALS = 6;

export type InvoiceState = {
  totalAmount: bigint;
  withdrawnAmount: bigint;
  refundedAmount: bigint;
  startTime: bigint;
  endTime: bigint;
  canceledAt: bigint;
};

export function vestedAt(invoice: InvoiceState, timestamp: bigint): bigint {
  let effective = timestamp < invoice.endTime ? timestamp : invoice.endTime;
  if (invoice.canceledAt !== 0n && invoice.canceledAt < effective) {
    effective = invoice.canceledAt;
  }
  if (effective <= invoice.startTime) return 0n;
  if (effective >= invoice.endTime) return invoice.totalAmount;
  return (
    (invoice.totalAmount * (effective - invoice.startTime)) /
    (invoice.endTime - invoice.startTime)
  );
}

export function reconcile(invoice: InvoiceState, timestamp: bigint) {
  const vested = vestedAt(invoice, timestamp);
  const claimable = vested - invoice.withdrawnAmount;
  const liability =
    invoice.totalAmount - invoice.withdrawnAmount - invoice.refundedAmount;
  const refundable =
    invoice.canceledAt !== 0n || timestamp >= invoice.endTime
      ? 0n
      : invoice.totalAmount - vested;
  return { vested, claimable, refundable, liability };
}

export function parseUsdc(value: string): bigint {
  if (!/^\d+(\.\d{0,6})?$/.test(value.trim())) {
    throw new Error('Enter a positive USDC amount with at most 6 decimals.');
  }
  return parseUnits(value.trim(), USDC_DECIMALS);
}

export function formatUsdc(value: bigint, maximumFractionDigits = 6): string {
  const [whole, fraction = ''] = formatUnits(value, USDC_DECIMALS).split('.');
  const trimmed = fraction.slice(0, maximumFractionDigits).replace(/0+$/, '');
  return `${Number(whole).toLocaleString('en-US')}${trimmed ? `.${trimmed}` : ''}`;
}

export function formatDate(timestamp: bigint): string {
  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'UTC',
  }).format(Number(timestamp) * 1000);
}

export function shortHash(value: string, width = 5): string {
  if (value.length <= width * 2 + 2) return value;
  return `${value.slice(0, width + 2)}…${value.slice(-width)}`;
}
