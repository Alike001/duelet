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
        <span>Streaming</span>
      </div>
      <div className="invoice-title">
        <p>Design services · DUE-0042</p>
        <h2>
          0.010000 <small>USDC</small>
        </h2>
      </div>
      <div className="address-row">
        <div>
          <span>Payer</span>
          <strong>0x7A4c…d9D1</strong>
        </div>
        <span className="flow-arrow">→</span>
        <div>
          <span>Payee</span>
          <strong>0x21aC…6542</strong>
        </div>
      </div>
      <div className="progress-label">
        <span>Vesting progress</span>
        <strong>{progress.toFixed(2)}%</strong>
      </div>
      <div className="progress-track">
        <span style={{ width: `${progress}%` }} />
      </div>
      <div className="demo-metrics">
        <div>
          <span>Vested</span>
          <strong>{formatUsdc(data.vested)}</strong>
        </div>
        <div>
          <span>Claimable</span>
          <strong>{formatUsdc(data.claimable)}</strong>
        </div>
        <div>
          <span>Unvested</span>
          <strong>{formatUsdc(data.refundable)}</strong>
        </div>
      </div>
      <div className="cancel-preview">
        <span>If canceled now</span>
        <div>
          <p>
            Payee keeps <strong>{formatUsdc(data.claimable)} USDC</strong>
          </p>
          <p>
            Payer receives <strong>{formatUsdc(data.refundable)} USDC</strong>
          </p>
        </div>
      </div>
      <p className="demo-foot">
        Values use the contract’s integer floor rounding. Claims are triggered
        transactions, not automatic transfers.
      </p>
    </aside>
  );
}
