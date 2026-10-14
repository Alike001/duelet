'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { isHex } from 'viem';
import {
  useConnection,
  useReadContracts,
  useSimulateContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from 'wagmi';

import { dueletAbi } from '@/lib/abi';
import {
  ARC_CHAIN_ID,
  ARC_USDC_ADDRESS,
  addressUrl,
  deployment,
  txUrl,
} from '@/lib/chain';
import { activityForInvoice, loadActivity } from '@/lib/events';
import { useDeploymentVerification } from '@/lib/deployment-verification';
import { formatDate, formatUsdc, reconcile, shortHash } from '@/lib/finance';
import { PREVIEW_INVOICE_ID, previewInvoice, previewNow } from '@/lib/preview';

import { CopyIcon, ExternalIcon } from './icons';
import { StatusPill } from './status-pill';

type InvoiceTuple = readonly [
  `0x${string}`,
  `0x${string}`,
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
  `0x${string}`,
];

export function InvoiceView({
  requestedId,
  proof = false,
}: {
  requestedId: string;
  proof?: boolean;
}) {
  const connection = useConnection();
  const deploymentVerification = useDeploymentVerification();
  const [replacementNotice, setReplacementNotice] = useState('');
  const preview =
    requestedId === 'preview' ||
    requestedId.toLowerCase() === PREVIEW_INVOICE_ID.toLowerCase();
  const validId =
    isHex(requestedId, { strict: true }) && requestedId.length === 66;
  const id = (preview ? PREVIEW_INVOICE_ID : requestedId) as `0x${string}`;
  const enabled = !preview && validId && Boolean(deployment.address);
  const reads = useReadContracts({
    contracts:
      deployment.address && enabled
        ? [
            {
              address: deployment.address,
              abi: dueletAbi,
              functionName: 'getInvoice',
              args: [id],
            },
            {
              address: deployment.address,
              abi: dueletAbi,
              functionName: 'vestedAmount',
              args: [id],
            },
            {
              address: deployment.address,
              abi: dueletAbi,
              functionName: 'claimableAmount',
              args: [id],
            },
            {
              address: deployment.address,
              abi: dueletAbi,
              functionName: 'refundableAmount',
              args: [id],
            },
            {
              address: deployment.address,
              abi: dueletAbi,
              functionName: 'invoiceLiability',
              args: [id],
            },
            {
              address: deployment.address,
              abi: dueletAbi,
              functionName: 'invoiceStatus',
              args: [id],
            },
          ]
        : [],
    query: { enabled, refetchInterval: enabled ? 8_000 : false },
  });

  const data = useMemo(() => {
    if (preview) {
      const accounting = reconcile(previewInvoice, previewNow);
      return {
        ...previewInvoice,
        ...accounting,
        status: 'Streaming',
        illustrative: true,
      };
    }
    const tuple = reads.data?.[0]?.result as InvoiceTuple | undefined;
    if (!tuple) return undefined;
    const statuses = [
      'Nonexistent',
      'Scheduled',
      'Streaming',
      'Matured',
      'Canceled',
      'Settled',
    ];
    const resultAt = (index: number) => {
      const result = reads.data?.[index]?.result;
      return typeof result === 'bigint' ? result : 0n;
    };
    return {
      invoiceId: id,
      reference: 'Reference hash available in creation event',
      referenceHash: undefined,
      payer: tuple[0],
      payee: tuple[1],
      totalAmount: tuple[2],
      withdrawnAmount: tuple[3],
      refundedAmount: tuple[4],
      startTime: tuple[5],
      endTime: tuple[6],
      canceledAt: tuple[7],
      metadataHash: tuple[8],
      vested: resultAt(1),
      claimable: resultAt(2),
      refundable: resultAt(3),
      liability: resultAt(4),
      status: statuses[Number(reads.data?.[5]?.result ?? 0)] ?? 'Unknown',
      illustrative: false,
    };
  }, [id, preview, reads.data]);

  const activity = useQuery({
    queryKey: [
      'duelet-activity',
      deployment.address,
      deployment.block?.toString(),
    ],
    queryFn: loadActivity,
    enabled: enabled,
  });
  const events = data?.illustrative
    ? []
    : activityForInvoice(activity.data ?? [], id);
  const withdrawSimulation = useSimulateContract({
    address: deployment.address,
    abi: dueletAbi,
    functionName: 'withdraw',
    args: enabled && (data?.claimable ?? 0n) > 0n ? [id] : undefined,
    account: connection.address,
    chainId: ARC_CHAIN_ID,
    query: {
      enabled:
        enabled &&
        deploymentVerification.verified &&
        connection.chainId === ARC_CHAIN_ID &&
        (data?.claimable ?? 0n) > 0n,
    },
  });
  const canCancel = Boolean(
    enabled &&
    deploymentVerification.verified &&
    data &&
    data.payer.toLowerCase() === connection.address?.toLowerCase() &&
    data.refundable > 0n,
  );
  const cancelSimulation = useSimulateContract({
    address: deployment.address,
    abi: dueletAbi,
    functionName: 'cancel',
    args: canCancel ? [id] : undefined,
    account: connection.address,
    chainId: ARC_CHAIN_ID,
    query: {
      enabled: canCancel && connection.chainId === ARC_CHAIN_ID,
      refetchInterval: 2_000,
    },
  });
  const withdraw = useWriteContract();
  const cancel = useWriteContract();
  const withdrawReceipt = useWaitForTransactionReceipt({
    hash: withdraw.data,
    onReplaced: ({ reason }) =>
      setReplacementNotice(`Claim transaction was ${reason}.`),
  });
  const cancelReceipt = useWaitForTransactionReceipt({
    hash: cancel.data,
    onReplaced: ({ reason }) =>
      setReplacementNotice(`Cancellation transaction was ${reason}.`),
  });
  const refetchReads = reads.refetch;
  const refetchActivity = activity.refetch;

  useEffect(() => {
    if (!withdrawReceipt.isSuccess && !cancelReceipt.isSuccess) return;
    void refetchReads();
    void refetchActivity();
  }, [
    cancelReceipt.isSuccess,
    refetchActivity,
    refetchReads,
    withdrawReceipt.isSuccess,
  ]);

  if (!preview && !validId)
    return (
      <Unavailable
        title="Invalid invoice ID"
        body="Invoice IDs are 32-byte hexadecimal values. Check the URL and try again."
      />
    );
  if (!preview && deployment.mode === 'preview')
    return (
      <Unavailable
        title="Contract not deployed"
        body="A real invoice cannot be read until a verified contract address and deployment block are configured. Use the illustrative proof to inspect the complete accounting presentation."
      />
    );
  if (reads.isPending && !preview)
    return (
      <div className="detail-skeleton">
        <span />
        <span />
        <span />
      </div>
    );
  if (reads.isError || (!data && !preview))
    return (
      <Unavailable
        title="Invoice unavailable"
        body="The Arc RPC did not return a valid invoice. It may not exist, or the public RPC may be unavailable."
      />
    );
  if (!data) return null;

  const progress =
    data.totalAmount === 0n
      ? 0
      : Number((data.vested * 10_000n) / data.totalAmount) / 100;
  const preserved = data.vested - data.withdrawnAmount;
  return (
    <div className="invoice-view">
      <div className="invoice-top">
        <div>
          <div className="invoice-status-line">
            <StatusPill
              tone={
                data.illustrative
                  ? 'amber'
                  : data.status === 'Canceled'
                    ? 'red'
                    : 'green'
              }
            >
              {data.illustrative ? 'Illustrative data' : data.status}
            </StatusPill>
            <span>Arc · chain 5042</span>
          </div>
          <h1>
            {data.illustrative ? 'DUE-0042' : shortHash(data.invoiceId, 10)}
          </h1>
          <p className="mono">{data.invoiceId}</p>
        </div>
        <div className="invoice-top-actions">
          <button
            className="button button-ghost"
            type="button"
            onClick={() => navigator.clipboard.writeText(window.location.href)}
          >
            <CopyIcon /> Copy link
          </button>
          {deployment.address && (
            <a
              className="button button-ghost"
              href={addressUrl(deployment.address)}
              target="_blank"
              rel="noreferrer"
            >
              Contract <ExternalIcon />
            </a>
          )}
        </div>
      </div>
      <section className="financial-hero">
        <div className="financial-main">
          <span>Original deposit</span>
          <strong>{formatUsdc(data.totalAmount)}</strong>
          <small>USDC</small>
        </div>
        <div className="financial-progress">
          <div>
            <span>Vested</span>
            <strong>{formatUsdc(data.vested)} USDC</strong>
          </div>
          <div className="progress-track light">
            <span style={{ width: `${progress}%` }} />
          </div>
          <p>{progress.toFixed(2)}% vested · second-level block timestamps</p>
        </div>
      </section>
      <section className="metric-strip">
        <article>
          <span>Withdrawn</span>
          <strong>{formatUsdc(data.withdrawnAmount)}</strong>
        </article>
        <article className="claim">
          <span>Claimable now</span>
          <strong>{formatUsdc(data.claimable)}</strong>
        </article>
        <article>
          <span>Refundable now</span>
          <strong>{formatUsdc(data.refundable)}</strong>
        </article>
        <article>
          <span>Outstanding liability</span>
          <strong>{formatUsdc(data.liability)}</strong>
        </article>
      </section>
      <div className="detail-grid">
        <section className="panel timeline-panel">
          <div className="panel-head">
            <div>
              <h2>Payment timeline</h2>
              <p className="panel-subtitle">
                Entitlement accrues; funds move only when a claim is triggered.
              </p>
            </div>
          </div>
          <div className="timeline">
            <span className="timeline-line">
              <i style={{ left: `${Math.min(progress, 100)}%` }} />
            </span>
            <div>
              <span>Start</span>
              <strong>{formatDate(data.startTime)}</strong>
            </div>
            <div>
              <span>{data.canceledAt ? 'Canceled' : 'Observed now'}</span>
              <strong>
                {data.canceledAt
                  ? formatDate(data.canceledAt)
                  : `${progress.toFixed(2)}%`}
              </strong>
            </div>
            <div>
              <span>End</span>
              <strong>{formatDate(data.endTime)}</strong>
            </div>
          </div>
          <div className="party-grid">
            <div>
              <span>Payer</span>
              <strong>{shortHash(data.payer, 8)}</strong>
            </div>
            <div>
              <span>Payee</span>
              <strong>{shortHash(data.payee, 8)}</strong>
            </div>
          </div>
        </section>
        <aside className="panel action-panel">
          <h2>Available actions</h2>
          <p className="panel-subtitle">
            Every action is simulated again immediately before wallet
            confirmation.
          </p>
          <div className="destination-lock">
            <span>Claim destination</span>
            <strong>{shortHash(data.payee, 8)}</strong>
            <small>Immutable · cannot be edited</small>
          </div>
          <button
            className="button button-dark"
            disabled={
              !withdrawSimulation.data?.request ||
              data.illustrative ||
              withdraw.isPending ||
              withdrawReceipt.isLoading
            }
            onClick={() =>
              withdrawSimulation.data?.request &&
              withdraw.writeContract(withdrawSimulation.data.request)
            }
            type="button"
          >
            {withdrawReceipt.isLoading
              ? 'Claim submitted…'
              : `Trigger ${formatUsdc(data.claimable)} USDC claim`}
          </button>
          {data.payer.toLowerCase() === connection.address?.toLowerCase() &&
            data.refundable > 0n && (
              <div className="cancel-action">
                <strong>Cancel stream</strong>
                <p>
                  Estimated now: {formatUsdc(data.refundable)} refunded. Payee
                  preserves {formatUsdc(preserved)} unclaimed entitlement. This
                  estimate changes with time.
                </p>
                <button
                  className="button button-danger"
                  disabled={
                    !cancelSimulation.data?.request ||
                    cancel.isPending ||
                    cancelReceipt.isLoading
                  }
                  onClick={() =>
                    cancelSimulation.data?.request &&
                    cancel.writeContract(cancelSimulation.data.request)
                  }
                  type="button"
                >
                  {cancelReceipt.isLoading
                    ? 'Cancellation submitted…'
                    : 'Review and cancel'}
                </button>
              </div>
            )}
          {data.illustrative && (
            <p className="inline-warning">
              Actions are disabled because this is illustrative preview data.
            </p>
          )}
          {!data.illustrative && !deploymentVerification.verified && (
            <p className="inline-warning">
              Actions are locked because the configured deployment has not
              matched the approved runtime bytecode and Arc USDC immutable.
            </p>
          )}
          {withdraw.error && (
            <p className="tx-error">
              Claim failed or was rejected: {withdraw.error.message}
            </p>
          )}
          {cancel.error && (
            <p className="tx-error">
              Cancellation failed or was rejected: {cancel.error.message}
            </p>
          )}
          {withdrawReceipt.error && (
            <p className="tx-error">
              Claim receipt failed: {withdrawReceipt.error.message}
            </p>
          )}
          {cancelReceipt.error && (
            <p className="tx-error">
              Cancellation receipt failed: {cancelReceipt.error.message}
            </p>
          )}
          {replacementNotice && (
            <p className="inline-warning">{replacementNotice}</p>
          )}
          {withdrawReceipt.isSuccess && withdrawReceipt.data && (
            <p className="tx-success">
              Claim confirmed.{' '}
              <a
                href={txUrl(withdrawReceipt.data.transactionHash)}
                target="_blank"
                rel="noreferrer"
              >
                View receipt
              </a>
            </p>
          )}
          {cancelReceipt.isSuccess && cancelReceipt.data && (
            <p className="tx-success">
              Cancellation confirmed.{' '}
              <a
                href={txUrl(cancelReceipt.data.transactionHash)}
                target="_blank"
                rel="noreferrer"
              >
                View receipt
              </a>
            </p>
          )}
        </aside>
      </div>
      <section className="panel reconciliation">
        <div>
          <p className="eyebrow">Financial reconciliation</p>
          <h2>Every deposited unit has one accountable destination.</h2>
        </div>
        <div className="recon-equation">
          <div>
            <strong>{formatUsdc(data.totalAmount)}</strong>
            <span>Original deposit</span>
          </div>
          <b>=</b>
          <div>
            <strong>{formatUsdc(data.withdrawnAmount)}</strong>
            <span>Withdrawn</span>
          </div>
          <b>+</b>
          <div>
            <strong>{formatUsdc(data.refundedAmount)}</strong>
            <span>Refunded</span>
          </div>
          <b>+</b>
          <div>
            <strong>{formatUsdc(data.liability)}</strong>
            <span>Liability</span>
          </div>
        </div>
      </section>
      <section className="panel evidence-panel">
        <div className="panel-head">
          <div>
            <h2>{proof ? 'Onchain evidence' : 'Transaction history'}</h2>
            <p className="panel-subtitle">
              {data.illustrative
                ? 'No transaction hashes exist for this deterministic example.'
                : 'Confirmed events associated with this invoice.'}
            </p>
          </div>
          {!proof && (
            <Link href={`/proof/${data.invoiceId}`}>Open proof page</Link>
          )}
        </div>
        {data.illustrative ? (
          <div className="evidence-empty">
            Illustrative values are browser-calculated from the shared golden
            fixture and are not presented as onchain evidence.
          </div>
        ) : activity.isPending ? (
          <p>Loading confirmed logs…</p>
        ) : events.length ? (
          <div className="activity-list">
            {events.map((event) => (
              <article className="activity-row" key={event.key}>
                <span className={`event-glyph ${event.type}`} />
                <div>
                  <strong>{event.type}</strong>
                  <p>
                    Block {event.blockNumber.toString()} · log {event.logIndex}
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
                >
                  <ExternalIcon />
                </a>
              </article>
            ))}
          </div>
        ) : (
          <div className="evidence-empty">
            No confirmed events were returned for this invoice. Historical
            discovery may be incomplete if the public RPC truncated the
            configured range.
          </div>
        )}
      </section>
      <details className="advanced-details">
        <summary>Advanced contract information</summary>
        <dl>
          <div>
            <dt>Token contract</dt>
            <dd>{ARC_USDC_ADDRESS}</dd>
          </div>
          <div>
            <dt>Duelet contract</dt>
            <dd>{deployment.address ?? 'Not deployed'}</dd>
          </div>
          <div>
            <dt>Metadata hash</dt>
            <dd>{data.metadataHash}</dd>
          </div>
          <div>
            <dt>Raw deposit</dt>
            <dd>{data.totalAmount.toString()} base units</dd>
          </div>
          <div>
            <dt>Chain ID</dt>
            <dd>5042</dd>
          </div>
        </dl>
      </details>
    </div>
  );
}

function Unavailable({ title, body }: { title: string; body: string }) {
  return (
    <div className="empty-state detail-empty">
      <span className="empty-orbit" />
      <h2>{title}</h2>
      <p>{body}</p>
      <Link className="button button-dark" href="/proof/preview">
        Open illustrative proof
      </Link>
    </div>
  );
}
