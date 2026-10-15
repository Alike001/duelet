'use client';

import { useQuery } from '@tanstack/react-query';

import { deployment, txUrl } from '@/lib/chain';
import { loadActivity } from '@/lib/events';
import { activityForWallet } from '@/lib/activity-scope';
import { formatDate, formatUsdc, shortHash } from '@/lib/finance';

import { ExternalIcon } from './icons';

export function ActivityFeed({
  limit,
  wallet,
  scope = 'public',
}: {
  limit?: number;
  wallet?: string;
  scope?: 'public' | 'wallet';
}) {
  const query = useQuery({
    queryKey: [
      'duelet-activity',
      deployment.address,
      deployment.block?.toString(),
    ],
    queryFn: loadActivity,
    staleTime: 30_000,
    enabled:
      deployment.mode === 'deployed' && (scope === 'public' || Boolean(wallet)),
  });

  if (deployment.mode === 'preview')
    return (
      <EmptyActivity
        title="No onchain activity yet"
        body="Event history will appear after a verified Duelet deployment. Preview data is never inserted into this feed."
      />
    );
  if (scope === 'wallet' && !wallet)
    return (
      <EmptyActivity
        title="Connect to see your activity"
        body="Your activity shows invoices you funded or receive. Public onchain records are still visible to everyone."
      />
    );
  if (query.isPending)
    return (
      <div className="skeleton-stack" aria-label="Loading activity">
        <span />
        <span />
        <span />
      </div>
    );
  if (query.isError)
    return (
      <EmptyActivity
        title="Activity unavailable"
        body="The public Arc RPC could not return the configured event range."
        action={
          <button
            className="text-button"
            onClick={() => query.refetch()}
            type="button"
          >
            Retry RPC request
          </button>
        }
      />
    );
  const scoped =
    scope === 'wallet' ? activityForWallet(query.data, wallet) : query.data;
  const events = limit ? scoped.slice(0, limit) : scoped;
  if (!events.length)
    return (
      <EmptyActivity
        title={
          scope === 'wallet'
            ? 'No activity for this wallet'
            : 'No confirmed events'
        }
        body={
          scope === 'wallet'
            ? 'No confirmed payment events involve this wallet yet.'
            : 'No Duelet events were found in the configured deployment range.'
        }
      />
    );

  return (
    <div className="activity-list">
      {events.map((event) => (
        <article className="activity-row" key={event.key}>
          <span className={`event-glyph ${event.type}`} />{' '}
          <div>
            <strong>
              {event.type === 'created'
                ? 'Invoice funded'
                : event.type === 'withdrawn'
                  ? 'USDC claimed'
                  : 'Stream canceled'}
            </strong>
            <p>
              {shortHash(event.invoiceId, 7)} · block{' '}
              {event.blockNumber.toString()}
            </p>
          </div>
          <div className="activity-value">
            <strong>{formatUsdc(event.amount)} USDC</strong>
            <span>
              {event.timestamp
                ? formatDate(event.timestamp)
                : 'Timestamp unavailable'}
            </span>
          </div>
          <a
            className="icon-link"
            href={txUrl(event.transactionHash)}
            target="_blank"
            rel="noreferrer"
            aria-label="Open transaction in Arc Explorer"
          >
            <ExternalIcon />
          </a>
        </article>
      ))}
    </div>
  );
}

function EmptyActivity({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="empty-state">
      <span className="empty-orbit" />
      <h3>{title}</h3>
      <p>{body}</p>
      {action}
    </div>
  );
}
