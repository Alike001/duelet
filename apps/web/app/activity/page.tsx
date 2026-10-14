import { ActivityFeed } from '@/components/activity-feed';
import { PageShell } from '@/components/page-shell';
import { deployment } from '@/lib/chain';

export default function ActivityPage() {
  return (
    <PageShell compact>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Confirmed contract history</p>
          <h1>Activity</h1>
          <p>
            Creation, claim, and cancellation events read from Arc. A simulation
            or pending transaction never appears here as confirmed activity.
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
        <strong>Reliability:</strong> logs are requested in bounded 9,999-block
        ranges, deduplicated by transaction hash and log index, then ordered by
        block and log position.{' '}
        {deployment.mode === 'preview' &&
          'There is no deployment to index yet.'}
      </p>
    </PageShell>
  );
}
