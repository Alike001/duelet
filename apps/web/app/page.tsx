import Link from 'next/link';

import { ArrowIcon, ClockIcon, ShieldIcon } from '@/components/icons';
import { LandingMotion } from '@/components/landing-motion';
import { PageShell } from '@/components/page-shell';
import { StreamDemo } from '@/components/stream-demo';

export default function HomePage() {
  return (
    <PageShell>
      <LandingMotion>
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">USDC invoice streaming on Arc</p>
            <h1>
              Invoice once.
              <br />
              <span>Pay over time.</span>
            </h1>
            <p className="hero-lede">
              Fund an invoice in USDC on Arc. Payments vest over time,
              recipients claim earned funds, and unused escrow returns to the
              payer when a stream is canceled.
            </p>
            <div className="hero-actions">
              <Link className="button button-accent" href="/invoices/new">
                Create an invoice <ArrowIcon />
              </Link>
              <a className="button button-ghost" href="#how-it-works">
                Explore how it works
              </a>
            </div>
            <p className="hero-note">
              Fully funded escrow · Six-decimal accounting · No protocol fees
            </p>
          </div>
          <StreamDemo />
        </section>

        <section className="marquee" aria-label="Product principles">
          <div>
            <span>Fully funded before vesting</span>
            <i /> <span>Claims always reach the payee</span>
            <i /> <span>Unused escrow returns on cancellation</span>
            <i /> <span>Every balance reconciles onchain</span>
            <i />
          </div>
        </section>

        <section className="chapter" id="how-it-works">
          <div className="chapter-heading">
            <p className="eyebrow">One invoice. One escrow. One clear exit.</p>
            <h2>Payment terms become a timeline, not a collection problem.</h2>
          </div>
          <div className="steps-grid">
            <article>
              <span>01</span>
              <div className="step-icon">
                <ShieldIcon />
              </div>
              <h3>Create</h3>
              <p>
                Set a payee, exact USDC amount, and immutable start and end
                times. The invoice reference is bound to the payer and
                deployment.
              </p>
            </article>
            <article>
              <span>02</span>
              <div className="step-icon">
                <span className="coin">$</span>
              </div>
              <h3>Fund</h3>
              <p>
                Approve only the invoice amount. Duelet creates the stream only
                after the complete deposit arrives in escrow.
              </p>
            </article>
            <article>
              <span>03</span>
              <div className="step-icon">
                <ClockIcon />
              </div>
              <h3>Claim</h3>
              <p>
                Entitlement vests each second. Anyone can trigger a claim, but
                USDC can only go to the immutable payee.
              </p>
            </article>
          </div>
        </section>

        <section className="mechanism-grid">
          <article className="mechanism-primary">
            <p className="eyebrow">Cancellation without confiscation</p>
            <h2>
              Stop the future.
              <br />
              Preserve what was earned.
            </h2>
            <p>
              When the payer cancels, vesting freezes. Unvested USDC returns
              immediately; every vested but unclaimed unit remains owed to the
              payee.
            </p>
            <div className="split-bar">
              <span style={{ width: '33.33%' }}>Earned 3,333</span>
              <span style={{ width: '66.67%' }}>Refund 6,667</span>
            </div>
            <p className="microcopy">
              Illustrative deterministic fixture · 10,000 base units
            </p>
          </article>
          <article className="mechanism-accounting">
            <p className="eyebrow">Accounting identity</p>
            <div className="equation">
              <strong>10,000</strong>
              <span>original deposit</span>
              <b>=</b>
              <div>
                <strong>3,333</strong>
                <span>withdrawn</span>
              </div>
              <b>+</b>
              <div>
                <strong>6,667</strong>
                <span>refunded</span>
              </div>
              <b>+</b>
              <div>
                <strong>0</strong>
                <span>liability</span>
              </div>
            </div>
          </article>
          <article className="mechanism-small">
            <h3>Arc-native settlement</h3>
            <p>
              USDC is both the payment asset and Arc’s native gas asset, while
              contract amounts retain the ERC-20’s six-decimal units.
            </p>
          </article>
          <article className="mechanism-small dark">
            <h3>No hidden operator</h3>
            <p>
              No owner, proxy, fee collector, sweep, or arbitrary execution
              path. Rights live in contract state.
            </p>
          </article>
          <article className="mechanism-small warning">
            <h3>Unaudited by design disclosure</h3>
            <p>
              Tests are extensive, not an audit. Circle can pause or block USDC
              transfers. Start with minimal value.
            </p>
          </article>
        </section>

        <section className="trust-section">
          <div>
            <p className="eyebrow">Verify, don’t take our word for it</p>
            <h2>
              The interface explains the contract. The contract remains the
              authority.
            </h2>
          </div>
          <div className="trust-list">
            <article>
              <span>01</span>
              <h3>Exact balances</h3>
              <p>
                Funding and payouts validate token balance deltas. Failed
                transfers revert accounting atomically.
              </p>
            </article>
            <article>
              <span>02</span>
              <h3>Independent recovery</h3>
              <p>
                Claims and cancellation can be submitted directly through any
                EVM wallet if the frontend disappears.
              </p>
            </article>
            <article>
              <span>03</span>
              <h3>Public proof</h3>
              <p>
                Invoice state, events, transaction receipts, and the
                reconciliation identity are available to reviewers.
              </p>
            </article>
          </div>
        </section>

        <section className="closing-cta">
          <p>Turn one invoice into a payment schedule both sides can verify.</p>
          <h2>Ready when the work is.</h2>
          <div>
            <Link className="button button-accent" href="/invoices/new">
              Create an invoice <ArrowIcon />
            </Link>
            <Link className="button button-inverse" href="/docs">
              Read the protocol guide
            </Link>
          </div>
        </section>
      </LandingMotion>
    </PageShell>
  );
}
