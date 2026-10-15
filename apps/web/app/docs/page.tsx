import Link from 'next/link';

import { PageShell } from '@/components/page-shell';
import { MAINNET_PROOF_PATH, MAINNET_CONTRACT_URL } from '@/lib/evidence';

const topics = [
  [
    'Payment visibility',
    'Arc is public. Wallet addresses, amounts, schedules, claims, and refunds can be read by anyone. My invoices and your workspace filter records to your connected wallet; Public activity shows all Duelet wallets. This filtering is not encryption or access control. Never put confidential information in an onchain reference or metadata field.',
  ],
  [
    'How funding works',
    'A payer approves the exact invoice amount, then createAndFund atomically records immutable terms and pulls the complete amount into escrow. An invoice cannot exist in an underfunded state.',
  ],
  [
    'Linear vesting',
    'Vesting uses block.timestamp seconds and integer floor division. It describes entitlement, not an automatic transfer. Anyone may trigger a full current claim, which always pays the stored payee.',
  ],
  [
    'Cancellation',
    'Only the payer may cancel before maturity. Vesting freezes at the cancellation timestamp, unvested USDC returns to the payer, and all vested but unclaimed value remains owed to the payee.',
  ],
  [
    'Accounting',
    'For every invoice: original deposit = withdrawn + refunded + remaining liability. The contract separately tracks aggregate outstanding liability across all invoices.',
  ],
  [
    'What Arc contributes',
    'Arc settles with USDC as its native gas asset while the contract uses the official six-decimal USDC ERC-20 interface. Gas wei and token base units are deliberately kept separate.',
  ],
  [
    'Direct recovery',
    'The frontend is optional. A user can call claimableAmount and withdraw directly through an EVM wallet or block explorer. The caller never supplies a recipient.',
  ],
];

export default function DocsPage() {
  return (
    <PageShell compact>
      <div className="docs-layout">
        <aside className="docs-nav">
          <strong>Protocol guide</strong>
          {topics.map(([title]) => (
            <a
              href={`#${title.toLowerCase().replaceAll(' ', '-')}`}
              key={title}
            >
              {title}
            </a>
          ))}
          <a href="#risks">Risks and limits</a>
        </aside>
        <article className="docs-content">
          <p className="eyebrow">Duelet documentation</p>
          <h1>A predictable path from invoice to exit.</h1>
          <p className="docs-lede">
            Duelet is a non-upgradeable, fully funded USDC streaming escrow. It
            independently implements invoice identity, vesting, claims,
            cancellation refunds, and reconciliation.
          </p>
          <div className="docs-callout">
            <strong>Important</strong>
            <p>
              Duelet is deployed on Arc mainnet and remains unaudited. A preview
              or unverified configuration cannot send transactions. Do not treat
              this interface as a safety guarantee.
            </p>
          </div>
          {topics.map(([title, body]) => (
            <section id={title.toLowerCase().replaceAll(' ', '-')} key={title}>
              <h2>{title}</h2>
              <p>{body}</p>
              {title === 'Linear vesting' && (
                <pre>
                  <code>vested = floor(totalAmount × elapsed / duration)</code>
                </pre>
              )}
              {title === 'Accounting' && (
                <pre>
                  <code>deposit = withdrawn + refunded + liability</code>
                </pre>
              )}
            </section>
          ))}
          <section id="risks">
            <h2>Risks and unsupported capabilities</h2>
            <ul>
              <li>
                Circle may pause USDC, block addresses, or upgrade its external
                implementation.
              </li>
              <li>
                Duelet does not resolve invoice disputes or verify offchain
                work.
              </li>
              <li>
                No fees, yield, FX, recurring subscriptions, governance, proxy
                upgrades, or admin recovery exist.
              </li>
              <li>
                Direct accidental token transfers are surplus and cannot be
                swept in V1.
              </li>
              <li>
                Public RPC event history may be incomplete; contract state
                remains authoritative.
              </li>
            </ul>
          </section>
          <section>
            <h2>Source and deployment evidence</h2>
            <p>
              The source is public on{' '}
              <a
                href="https://github.com/Alike001/duelet"
                target="_blank"
                rel="noreferrer"
              >
                GitHub
              </a>
              . The{' '}
              <a href={MAINNET_CONTRACT_URL} target="_blank" rel="noreferrer">
                verified mainnet contract
              </a>{' '}
              has a confirmed 0.01 USDC funding and full claim. Cancellation is
              tested in the repository but is not claimed as mainnet
              demonstration evidence.
            </p>
            <div className="docs-actions">
              <Link className="button button-dark" href={MAINNET_PROOF_PATH}>
                View real payment proof
              </Link>
              <Link className="button button-ghost" href="/invoices/new">
                Create a payment
              </Link>
            </div>
          </section>
        </article>
      </div>
    </PageShell>
  );
}
