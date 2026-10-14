'use client';

import Link from 'next/link';
import { useConnection } from 'wagmi';

import { ActivityFeed } from '@/components/activity-feed';
import { ArrowIcon, WalletIcon } from '@/components/icons';
import { PageShell } from '@/components/page-shell';
import { WalletButton } from '@/components/wallet-button';
import { deployment } from '@/lib/chain';

export default function WorkspacePage() {
  const connection = useConnection();
  return (
    <PageShell compact>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Payment workspace</p>
          <h1>Your streams</h1>
        </div>
        <Link className="button button-accent" href="/invoices/new">
          Create invoice <ArrowIcon />
        </Link>
      </div>
      {connection.status !== 'connected' ? (
        <div className="workspace-disconnected">
          <section className="wallet-gate">
            <p className="eyebrow">Your address is the account</p>
            <div className="wallet-visual">
              <WalletIcon />
            </div>
            <h2>Connect a wallet to find your invoices.</h2>
            <p>
              Duelet searches confirmed contract events for streams where this
              address is the payer or payee. No account or email is required.
            </p>
            <WalletButton />
          </section>
          <aside className="workspace-role-guide">
            <div>
              <span>As payer</span>
              <strong>Create · fund · cancel</strong>
              <p>
                Lock the complete payment, monitor vesting, and recover only the
                portion the recipient has not earned.
              </p>
            </div>
            <div>
              <span>As recipient</span>
              <strong>Inspect · claim · prove</strong>
              <p>
                Watch entitlement vest and receive every earned unit at the
                immutable payee address.
              </p>
            </div>
            <small>
              Public proof pages remain available without connecting a wallet.
            </small>
          </aside>
        </div>
      ) : (
        <>
          <section className="workspace-summary">
            <article>
              <span>Created by me</span>
              <strong>—</strong>
              <p>
                {deployment.mode === 'preview'
                  ? 'Unavailable before deployment'
                  : 'Loading from confirmed events'}
              </p>
            </article>
            <article>
              <span>Payable to me</span>
              <strong>—</strong>
              <p>
                {deployment.mode === 'preview'
                  ? 'No fabricated positions'
                  : 'Loading from confirmed events'}
              </p>
            </article>
            <article className="accent">
              <span>Claimable now</span>
              <strong>—</strong>
              <p>Calculated from latest onchain state</p>
            </article>
          </section>
          <div className="workspace-grid">
            <section className="panel">
              <div className="panel-head">
                <div>
                  <h2>Recent contract activity</h2>
                  <p className="panel-subtitle">Confirmed events only</p>
                </div>
                <Link href="/activity">View all</Link>
              </div>
              <ActivityFeed limit={5} />
            </section>
            <aside className="panel quick-panel">
              <h2>Start with an invoice</h2>
              <p>
                Set immutable terms, approve the exact amount, and fund escrow
                in one confirmed contract transaction.
              </p>
              <ol>
                <li>
                  <span>1</span>Enter payment terms
                </li>
                <li>
                  <span>2</span>Review approval
                </li>
                <li>
                  <span>3</span>Fund the stream
                </li>
              </ol>
              <Link className="button button-dark" href="/invoices/new">
                Open creation flow
              </Link>
            </aside>
          </div>
        </>
      )}
    </PageShell>
  );
}
