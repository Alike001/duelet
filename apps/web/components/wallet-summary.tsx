'use client';

import { useQuery } from '@tanstack/react-query';
import { useReadContracts } from 'wagmi';
import { parseAbi } from 'viem';

const claimAbi = parseAbi([
  'function claimableAmount(bytes32 invoiceId) view returns (uint256)',
]);
import { invoicesForWallet } from '@/lib/activity-scope';
import { deployment } from '@/lib/chain';
import { loadActivity } from '@/lib/events';
import { formatUsdc } from '@/lib/finance';

export function WalletSummary({ wallet }: { wallet: `0x${string}` }) {
  const query = useQuery({
    queryKey: [
      'duelet-activity',
      deployment.address,
      deployment.block?.toString(),
    ],
    queryFn: loadActivity,
    staleTime: 30_000,
    enabled: deployment.mode === 'deployed',
  });
  const invoices = invoicesForWallet(query.data ?? [], wallet);
  const payable = invoices.filter(
    (event) => event.payee?.toLowerCase() === wallet.toLowerCase(),
  );
  const funded = invoices.filter(
    (event) => event.payer?.toLowerCase() === wallet.toLowerCase(),
  );
  const claims = useReadContracts({
    contracts: deployment.address
      ? payable.map((event) => ({
          address: deployment.address!,
          abi: claimAbi,
          functionName: 'claimableAmount' as const,
          args: [event.invoiceId] as const,
        }))
      : [],
    query: {
      enabled: deployment.mode === 'deployed' && payable.length > 0,
      refetchInterval: 15_000,
    },
  });
  const historyReady = deployment.mode === 'deployed' && query.isSuccess;
  const allClaimsRead =
    claims.data?.length === payable.length &&
    claims.data.every(
      (result) =>
        result.status === 'success' && typeof result.result === 'bigint',
    );
  const total =
    historyReady && (payable.length === 0 || allClaimsRead)
      ? (claims.data ?? []).reduce(
          (sum, result) =>
            sum + (typeof result.result === 'bigint' ? result.result : 0n),
          0n,
        )
      : undefined;
  const failed =
    query.isError ||
    claims.isError ||
    claims.data?.some((result) => result.status === 'failure');
  return (
    <section className="workspace-balances">
      <article className="primary-balance">
        <span>Available to claim</span>
        <strong>{total === undefined ? '—' : formatUsdc(total)}</strong>
        <small>USDC · payable to your connected wallet</small>
      </article>
      <dl>
        <div>
          <dt>Invoices funded</dt>
          <dd>{historyReady ? funded.length : '—'}</dd>
        </div>
        <div>
          <dt>Recipient invoices</dt>
          <dd>{historyReady ? payable.length : '—'}</dd>
        </div>
        <div>
          <dt>Network</dt>
          <dd>Arc mainnet</dd>
        </div>
      </dl>
      <p className="workspace-data-note">
        {deployment.mode === 'preview'
          ? 'No verified deployment is configured here; wallet balances are unavailable.'
          : failed
            ? 'Some payment data could not be read. Refresh to retry; no missing value is assumed to be zero.'
            : !historyReady || total === undefined
              ? 'Reading your invoices and current claimable amounts…'
              : 'Based on discovered invoice events and current contract reads. Public RPC history may be incomplete.'}
      </p>
    </section>
  );
}
