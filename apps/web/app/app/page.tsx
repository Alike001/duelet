'use client';

import Link from 'next/link';
import { useConnection } from 'wagmi';

import { ActivityFeed } from '@/components/activity-feed';
import { ArrowIcon, WalletIcon } from '@/components/icons';
import { PageShell } from '@/components/page-shell';
import { WalletButton } from '@/components/wallet-button';
import { WalletSummary } from '@/components/wallet-summary';

export default function WorkspacePage() {
  const connection = useConnection();

  return (
    <PageShell compact>
      <div className="workspace-header">
        <div>
          <p className="page-kicker">Overview</p>
          <h1>Payment workspace</h1>
          <p>Fund invoices, track scheduled payments, and claim earned USDC.</p>
        </div>
        <Link className="button button-accent" href="/invoices/new">
          Create payment <ArrowIcon />
        </Link>
      </div>

      <nav className="workspace-tabs" aria-label="Workspace sections">
        <Link className="active" href="/app">
          Overview
        </Link>
        <Link href="/invoices">My invoices</Link>
        <Link href="/invoices">Payments received</Link>
        <Link href="/activity">Activity</Link>
      </nav>

      {connection.status !== 'connected' ? (
        <section className="connect-onboarding">
          <div className="connect-onboarding-copy">
            <span className="onboarding-icon">
              <WalletIcon />
            </span>
            <p className="page-kicker">Your wallet is your account</p>
            <h2>Connect to see payments tied to your address.</h2>
            <p>
              Duelet reads confirmed Arc events to find invoices you funded and
              payments sent to you. No email account or profile is required.
            </p>
            <WalletButton />
          </div>
          <div className="onboarding-preview">
            <div className="preview-toolbar">
              <span>Your overview</span>
              <i>Preview</i>
            </div>
            <div className="preview-balance">
              <span>Available to claim</span>
              <strong>—</strong>
              <small>USDC</small>
            </div>
            <div className="preview-rows">
              <div>
                <span>Invoices funded</span>
                <strong>Connect to view</strong>
              </div>
              <div>
                <span>Payments received</span>
                <strong>Connect to view</strong>
              </div>
              <div>
                <span>Confirmed activity</span>
                <strong>Connect to view</strong>
              </div>
            </div>
            <p>No balances or invoices are assumed before connection.</p>
          </div>
        </section>
      ) : (
        <div className="workspace-connected">
          {connection.address && (
            <WalletSummary
              key={connection.address}
              wallet={connection.address}
            />
          )}

          <div className="workspace-content-grid">
            <section className="workspace-activity">
              <div className="section-row-head">
                <div>
                  <h2>Recent activity</h2>
                  <p>Confirmed events for invoices you funded or receive</p>
                </div>
                <Link href="/activity">Public activity</Link>
              </div>
              <ActivityFeed
                limit={5}
                scope="wallet"
                wallet={connection.address}
              />
            </section>
            <aside className="workspace-next-step">
              <span>New payment</span>
              <h2>Fund an invoice in two wallet steps.</h2>
              <ol>
                <li>
                  <i>1</i>
                  <span>
                    <strong>Approve</strong>Exactly the invoice amount
                  </span>
                </li>
                <li>
                  <i>2</i>
                  <span>
                    <strong>Fund</strong>Create the schedule and escrow
                  </span>
                </li>
              </ol>
              <Link className="button button-secondary" href="/invoices/new">
                Compose payment
              </Link>
            </aside>
          </div>
        </div>
      )}
    </PageShell>
  );
}
