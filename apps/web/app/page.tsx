import Link from 'next/link';

import { ArrowIcon } from '@/components/icons';
import { LandingMotion } from '@/components/landing-motion';
import { PageShell } from '@/components/page-shell';
import { StreamDemo } from '@/components/stream-demo';

export default function HomePage() {
  return (
    <PageShell>
      <LandingMotion>
        <section className="home-hero">
          <div className="home-hero-copy">
            <div className="network-chip">
              <span>USDC</span>
              <i />
              <span>Arc mainnet</span>
            </div>
            <h1>Invoice once. Pay over time.</h1>
            <p>
              Fund a contractor payment upfront. Your recipient earns USDC over
              an agreed schedule and claims it to their wallet. Every dollar
              stays accounted for onchain.
            </p>
            <div className="hero-actions">
              <Link className="button button-accent" href="/invoices/new">
                Create payment <ArrowIcon />
              </Link>
              <Link className="text-link" href="/proof/preview">
                Explore an example <span>→</span>
              </Link>
            </div>
            <a
              className="mainnet-proof-link"
              href="https://explorer.arc.io/tx/0xc8eda3ec664830e7eb1a0ca5702b266cc8df1eaf2ed1d3cbd1d495cab065acc6"
              target="_blank"
              rel="noreferrer"
            >
              <span aria-hidden="true">↗</span> View a real 0.01 USDC funding
              transaction
            </a>
            <div className="hero-assurance">
              <span>Fully funded before it starts</span>
              <span>Recipient address cannot change</span>
              <span>No admin access to escrow</span>
            </div>
          </div>
          <StreamDemo />
        </section>

        <section className="home-section how-section" id="how-it-works">
          <div className="section-heading">
            <span>How it works</span>
            <h2>
              One funded invoice. A payment schedule both sides can follow.
            </h2>
          </div>
          <div className="process-line">
            <article>
              <span>01</span>
              <h3>Create the payment</h3>
              <p>
                Choose the recipient, exact USDC amount, and payment period.
              </p>
            </article>
            <article>
              <span>02</span>
              <h3>Fund it once</h3>
              <p>
                The complete amount enters escrow before the schedule exists.
              </p>
            </article>
            <article>
              <span>03</span>
              <h3>Claim as it vests</h3>
              <p>
                Earned USDC becomes available over time and moves when claimed.
              </p>
            </article>
          </div>
        </section>

        <section className="home-section role-section">
          <div className="role-intro">
            <span>Built for both sides</span>
            <h2>A clearer way to fund work and receive payment.</h2>
          </div>
          <div className="role-columns">
            <article>
              <div className="role-number">P</div>
              <div>
                <span>For the payer</span>
                <h3>Commit the budget. Release funds on an agreed schedule.</h3>
                <ul>
                  <li>Fund the complete invoice upfront</li>
                  <li>Track vested and remaining scheduled amounts</li>
                  <li>Cancel future vesting and recover unused escrow</li>
                </ul>
              </div>
            </article>
            <article>
              <div className="role-number recipient">R</div>
              <div>
                <span>For the recipient</span>
                <h3>See exactly what is earned and available to claim.</h3>
                <ul>
                  <li>Payment terms cannot change after funding</li>
                  <li>Earned funds survive cancellation</li>
                  <li>Claims always pay the stored recipient address</li>
                </ul>
              </div>
            </article>
          </div>
        </section>

        <section className="home-section cancellation-section">
          <div className="cancellation-copy">
            <span>Fair cancellation</span>
            <h2>Stop what comes next. Keep what was already earned.</h2>
            <p>
              Cancellation freezes the schedule. The unvested portion returns to
              the payer immediately, while the recipient keeps every vested
              unit—even if it has not been claimed yet.
            </p>
          </div>
          <div className="cancellation-example">
            <div className="example-head">
              <span>Example at 60 seconds</span>
              <strong>10,000 base units funded</strong>
            </div>
            <div className="allocation-bar">
              <span style={{ width: '33.33%' }}>Earned</span>
              <span style={{ width: '66.67%' }}>Returned</span>
            </div>
            <dl>
              <div>
                <dt>Recipient earned</dt>
                <dd>3,333</dd>
              </div>
              <div>
                <dt>Payer refund</dt>
                <dd>6,667</dd>
              </div>
              <div>
                <dt>Unaccounted</dt>
                <dd>0</dd>
              </div>
            </dl>
          </div>
        </section>

        <section className="home-section proof-section">
          <div className="proof-equation">
            <span>Public reconciliation</span>
            <div>
              <strong>Funding</strong>
              <b>=</b>
              <strong>Withdrawn</strong>
              <b>+</b>
              <strong>Refunded</strong>
              <b>+</b>
              <strong>Remaining</strong>
            </div>
          </div>
          <div className="proof-copy">
            <h2>A payment receipt anyone can verify.</h2>
            <p>
              Each invoice exposes its funded amount, payment schedule, claims,
              refunds, remaining escrow, and confirmed transaction evidence.
            </p>
            <Link className="text-link" href="/proof/preview">
              View illustrative proof <span>→</span>
            </Link>
          </div>
        </section>

        <section className="home-section arc-section">
          <div>
            <span>Why Arc</span>
            <h2>USDC payments with USDC-denominated transaction costs.</h2>
          </div>
          <p>
            Duelet uses Arc mainnet and official USDC. Invoice amounts use the
            token’s six-decimal accounting, while Arc handles network fees
            through its native USDC interface. The app keeps those units
            separate and visible.
          </p>
          <p className="disclosure">
            Duelet is unaudited software. Circle can pause or block USDC
            transfers. Payments follow elapsed time, not work completion.
          </p>
        </section>

        <section className="home-final-cta">
          <div>
            <span>One invoice. One schedule. One clear record.</span>
            <h2>Give every payment a clear schedule.</h2>
          </div>
          <Link className="button button-accent" href="/invoices/new">
            Create payment <ArrowIcon />
          </Link>
        </section>
      </LandingMotion>
    </PageShell>
  );
}
