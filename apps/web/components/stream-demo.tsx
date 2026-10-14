'use client';

import { useEffect, useMemo, useState } from 'react';

import {
  formatUsdc,
  ILLUSTRATIVE_STREAM_DURATION,
  illustrativeInvoiceAt,
  nextIllustrativeElapsed,
  reconcile,
} from '@/lib/finance';

const flow = ['Funded', 'Vesting', 'Claimable', 'Settled'] as const;

export function StreamDemo() {
  const [elapsed, setElapsed] = useState(60n);

  useEffect(() => {
    const timer = window.setInterval(
      () => setElapsed(nextIllustrativeElapsed),
      1_000,
    );
    return () => window.clearInterval(timer);
  }, []);

  const invoice = useMemo(() => illustrativeInvoiceAt(elapsed), [elapsed]);
  const data = reconcile(invoice, elapsed);
  const progress = Number((data.vested * 10_000n) / invoice.totalAmount) / 100;
  const flowStep = elapsed === 0n ? 0 : elapsed < 180n ? 2 : 3;

  return (
    <aside
      className="stream-instrument"
      aria-label="Illustrative invoice stream"
    >
      <div className="instrument-topline">
        <div>
          <span className="live-dot" /> Illustrative payment
        </div>
        <span>Arc · USDC</span>
      </div>

      <div className="instrument-title">
        <div>
          <span>Invoice DUE-0042</span>
          <h2>
            0.010000 <small>USDC</small>
          </h2>
        </div>
        <span className="funding-state">Fully funded</span>
      </div>

      <div className="instrument-parties">
        <div>
          <span>Payer</span>
          <strong>0x7A4c…d9D1</strong>
        </div>
        <span aria-hidden="true">→</span>
        <div>
          <span>Recipient</span>
          <strong>0x21aC…6542</strong>
        </div>
      </div>

      <div className="flow-stages" aria-label="Payment lifecycle">
        {flow.map((stage, index) => (
          <div
            className={index <= flowStep ? 'flow-stage active' : 'flow-stage'}
            key={stage}
          >
            <i />
            <span>{stage}</span>
          </div>
        ))}
      </div>

      <div className="instrument-progress">
        <div>
          <span>Payment progress</span>
          <strong>{progress.toFixed(1)}%</strong>
        </div>
        <div className="progress-track">
          <span style={{ width: `${progress}%` }} />
        </div>
        <small>
          {elapsed.toString()} of {ILLUSTRATIVE_STREAM_DURATION.toString()}{' '}
          seconds
        </small>
      </div>

      <div className="instrument-ledger">
        <div>
          <span>Vested</span>
          <strong>{formatUsdc(data.vested)}</strong>
          <small>USDC</small>
        </div>
        <div className="emphasis">
          <span>Available to claim</span>
          <strong>{formatUsdc(data.claimable)}</strong>
          <small>USDC</small>
        </div>
        <div>
          <span>Already withdrawn</span>
          <strong>{formatUsdc(invoice.withdrawnAmount)}</strong>
          <small>USDC</small>
        </div>
        <div>
          <span>Still unvested</span>
          <strong>{formatUsdc(data.refundable)}</strong>
          <small>USDC</small>
        </div>
      </div>

      <div className="instrument-cancel">
        <span>If canceled now</span>
        <p>
          The recipient keeps <strong>{formatUsdc(data.claimable)} USDC</strong>{' '}
          still owed; the payer receives{' '}
          <strong>{formatUsdc(data.refundable)} USDC</strong> back.
        </p>
      </div>
    </aside>
  );
}
