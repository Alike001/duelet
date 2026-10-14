'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useMemo } from 'react';
import { useReadContract } from 'wagmi';

import { dueletAbi } from '@/lib/abi';
import { deployment } from '@/lib/chain';
import { loadActivity, type DueletActivity } from '@/lib/events';
import { formatUsdc, shortHash } from '@/lib/finance';

import { StatusPill } from './status-pill';

export function InvoiceRegistry({
  filter,
  search,
  wallet,
}: {
  filter: string;
  search: string;
  wallet?: string;
}) {
  const query = useQuery({
    queryKey: [
      'duelet-activity',
      deployment.address,
      deployment.block?.toString(),
    ],
    queryFn: loadActivity,
    enabled: deployment.mode === 'deployed',
  });
  const created = useMemo(() => {
    const seen = new Set<string>();
    return (query.data ?? []).filter((item) => {
      if (item.type !== 'created' || seen.has(item.invoiceId)) return false;
      seen.add(item.invoiceId);
      const matchSearch =
        !search ||
        item.invoiceId.toLowerCase().includes(search.toLowerCase()) ||
        item.referenceHash?.toLowerCase().includes(search.toLowerCase());
      const matchRole =
        (filter !== 'Created by me' && filter !== 'Payable to me') ||
        (filter === 'Created by me' &&
          item.payer?.toLowerCase() === wallet?.toLowerCase()) ||
        (filter === 'Payable to me' &&
          item.payee?.toLowerCase() === wallet?.toLowerCase());
      return matchSearch && matchRole;
    });
  }, [filter, query.data, search, wallet]);

  if (deployment.mode === 'preview')
    return (
      <RegistryEmpty
        title="No deployed invoice registry yet"
        body="Preview mode never fabricates wallet positions. Inspect the deterministic proof while deployment remains pending."
      />
    );
  if (query.isPending)
    return (
      <div className="skeleton-stack">
        <span />
        <span />
        <span />
      </div>
    );
  if (query.isError)
    return (
      <RegistryEmpty
        title="Invoice discovery unavailable"
        body="The public Arc RPC did not return the configured event range. Retry from the activity screen."
      />
    );
  if (!created.length)
    return (
      <RegistryEmpty
        title="No matching invoices found"
        body="No confirmed creation event matched this role, state, or search. Public RPC history may be incomplete."
      />
    );
  return (
    <div>
      {created.map((item) => (
        <InvoiceRegistryRow event={item} filter={filter} key={item.invoiceId} />
      ))}
    </div>
  );
}

function InvoiceRegistryRow({
  event,
  filter,
}: {
  event: DueletActivity;
  filter: string;
}) {
  const statusRead = useReadContract({
    address: deployment.address,
    abi: dueletAbi,
    functionName: 'invoiceStatus',
    args: [event.invoiceId],
    query: { enabled: Boolean(deployment.address), staleTime: 8_000 },
  });
  const claimableRead = useReadContract({
    address: deployment.address,
    abi: dueletAbi,
    functionName: 'claimableAmount',
    args: [event.invoiceId],
    query: { enabled: Boolean(deployment.address), staleTime: 8_000 },
  });
  const statuses = [
    'Nonexistent',
    'Scheduled',
    'Streaming',
    'Matured',
    'Canceled',
    'Settled',
  ];
  const status = statuses[Number(statusRead.data ?? 0)] ?? 'Unknown';
  const claimable = claimableRead.data ?? 0n;
  const statusMatches =
    filter === 'All' ||
    filter === 'Created by me' ||
    filter === 'Payable to me' ||
    (filter === 'Active' &&
      ['Scheduled', 'Streaming', 'Matured'].includes(status)) ||
    (filter === 'Completed' && status === 'Settled') ||
    (filter === 'Canceled' && status === 'Canceled');
  if (!statusMatches) return null;
  return (
    <Link className="invoice-row" href={`/invoices/${event.invoiceId}`}>
      <div>
        <strong>{shortHash(event.invoiceId, 8)}</strong>
        <span>
          {event.referenceHash
            ? shortHash(event.referenceHash, 8)
            : 'Reference unavailable'}
        </span>
      </div>
      <span>{shortHash(event.payee ?? event.payer ?? '', 7)}</span>
      <StatusPill
        tone={
          status === 'Canceled'
            ? 'red'
            : status === 'Settled'
              ? 'neutral'
              : 'green'
        }
      >
        {statusRead.isPending ? 'Reading…' : status}
      </StatusPill>
      <strong>{formatUsdc(event.amount)} USDC</strong>
      <strong>{formatUsdc(claimable)} USDC</strong>
    </Link>
  );
}

function RegistryEmpty({ title, body }: { title: string; body: string }) {
  return (
    <div className="empty-state">
      <span className="empty-orbit" />
      <h3>{title}</h3>
      <p>{body}</p>
      <div className="empty-actions">
        <Link className="button button-dark" href="/invoices/new">
          Create an invoice
        </Link>
        <Link className="button button-ghost" href="/proof/preview">
          View illustrative proof
        </Link>
      </div>
    </div>
  );
}
