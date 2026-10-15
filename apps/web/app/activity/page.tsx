import { ActivityFeed } from '@/components/activity-feed';
import { PageShell } from '@/components/page-shell';
import { deployment } from '@/lib/chain';

export default function ActivityPage() {
  return (
    <PageShell compact>
      <div className="page-heading">
        <div>
          <p className="page-kicker">Confirmed payment history</p>
          <h1>Public activity</h1>
          <p>
            Confirmed payments across all Duelet wallets. Arc transactions are
            public: anyone can see wallet addresses, amounts, and payment times.
            For your own payments, open My invoices.
          </p>
        </div>
      </div>
      <section className="panel">
        <div className="activity-columns">
          <span>Event</span>
          <span>Amount and timestamp</span>
          <span>Receipt</span>
        </div>
        <ActivityFeed />
      </section>
      <p className="index-note">
        {deployment.mode === 'preview'
          ? 'Payment history will be available when a verified payment contract is configured.'
          : 'This feed may not include every payment. For a specific payment, open its invoice link or transaction in Arc Explorer.'}
      </p>
    </PageShell>
  );
}
