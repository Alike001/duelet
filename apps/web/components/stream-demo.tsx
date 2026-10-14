'use client';

import { useEffect, useMemo, useState } from 'react';

import { formatUsdc, reconcile } from '@/lib/finance';

export function StreamDemo() {
  const [elapsed, setElapsed] = useState(60n);
  useEffect(() => {
    const timer = window.setInterval(
      () => setElapsed((value) => (value >= 179n ? 0n : value + 1n)),
      1000,
    );
    return () => window.clearInterval(timer);
  }, []);
  const invoice = useMemo(
    () => ({
      totalAmount: 10_000n,
      withdrawnAmount: 1_000n,
      refundedAmount: 0n,
      startTime: 0n,
      endTime: 180n,
      canceledAt: 0n,
    }),
    [],
  );
  const data = reconcile(invoice, elapsed);
  const progress = Number((data.vested * 10_000n) / invoice.totalAmount) / 100;
  return (
    <aside
      className="stream-demo"
      aria-label="Illustrative invoice vesting demo"
    >
      <div className="demo-head">
        <div>
          <span className="preview-dot" /> Illustrative demo
        </div>
        <span>Live calculation · {elapsed.toString()} / 180 seconds</span>
      </div>
      <div className="stream-demo-grid">
        <div className="stream-demo-primary">
          <div className="invoice-title">
            <p>Design services · DUE-0042</p>
            <h2>
              0.010000 <small>USDC</small>
            </h2>
            <span>Fully funded escrow</span>
          </div>
          <div className="address-row">
            <div>
              <span>Payer</span>
              <strong>0x7A4c…d9D1</strong>
            </div>
            <span className="flow-arrow">→</span>
            <div>
              <span>Recipient</span>
              <strong>0x21aC…6542</strong>
            </div>
          </div>
          <div className="stream-meter">
            <div className="progress-label">
              <span>Time elapsed</span>
              <strong>{progress.toFixed(2)}%</strong>
            </div>
            <div className="progress-track">
              <span style={{ width: `${progress}%` }} />
              <i style={{ left: `${progress}%` }} />
            </div>
            <div className="stream-axis">
              <span>Funded · 00:00</span>
              <span>Fully vested · 03:00</span>
            </div>
          </div>
        </div>
        <div className="stream-ledger">
          <p className="eyebrow">Position now</p>
          <div className="demo-metrics">
            <div>
              <span>Vested</span>
              <strong>{formatUsdc(data.vested)}</strong>
              <small>USDC</small>
            </div>
            <div className="claimable-metric">
              <span>Claimable</span>
              <strong>{formatUsdc(data.claimable)}</strong>
              <small>USDC</small>
            </div>
            <div>
              <span>Still unvested</span>
              <strong>{formatUsdc(data.refundable)}</strong>
              <small>USDC</small>
            </div>
          </div>
          <div className="cancel-preview">
            <span>Cancel at this moment</span>
            <div>
              <p>
                Payee keeps <strong>{formatUsdc(data.claimable)} USDC</strong>
              </p>
              <p>
                Payer receives{' '}
                <strong>{formatUsdc(data.refundable)} USDC</strong>
              </p>
            </div>
          </div>
        </div>
      </div>
      <p className="demo-foot">
        Values use the contract’s integer floor rounding. Claims are triggered
        transactions, not automatic transfers.
      </p>
    </aside>
  );
}
