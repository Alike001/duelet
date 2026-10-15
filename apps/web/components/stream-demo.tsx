'use client';

import { useMemo, useState } from 'react';
import { formatUsdc, reconcile } from '@/lib/finance';

const flow = ['Funded', 'Earning', 'Claimable', 'Fully earned'] as const;

export function StreamDemo() {
  const [day, setDay] = useState(10);
  const invoice = useMemo(
    () => ({
      totalAmount: 3_000_000_000n,
      withdrawnAmount: day >= 5 ? 500_000_000n : 0n,
      refundedAmount: 0n,
      startTime: 0n,
      endTime: 30n * 86_400n,
      canceledAt: 0n,
    }),
    [day],
  );
  const data = reconcile(invoice, BigInt(day) * 86_400n);
  const progress = (day / 30) * 100;
  const flowStep = day === 0 ? 0 : day < 30 ? 2 : 3;

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
          <span>Example · 30-day contractor engagement</span>
          <h2>
            3,000 <small>USDC</small>
          </h2>
        </div>
        <span className="funding-state">Fully funded</span>
      </div>

      <div className="instrument-parties">
        <div>
          <span>Payer</span>
          <strong>Client</strong>
        </div>
        <span aria-hidden="true">→</span>
        <div>
          <span>Recipient</span>
          <strong>Contractor</strong>
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
        <small>Day {day} of 30 · 100 USDC earned per day</small>
      </div>

      <label className="demo-day-control">
        Explore the schedule
        <input
          type="range"
          min="0"
          max="30"
          step="1"
          value={day}
          onChange={(event) => setDay(Number(event.target.value))}
          aria-valuetext={`Day ${day} of 30`}
        />
        <span>
          Move the slider. An illustrative 500 USDC claim occurs on day 5.
        </span>
      </label>
      <div className="instrument-ledger">
        <div>
          <span>Earned so far</span>
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
          <span>Not yet earned</span>
          <strong>{formatUsdc(data.refundable)}</strong>
          <small>USDC</small>
        </div>
      </div>

      <div className="instrument-cancel">
        <span>{day < 30 ? 'If canceled now' : 'Schedule complete'}</span>
        <p>
          The recipient keeps <strong>{formatUsdc(data.claimable)} USDC</strong>{' '}
          still owed; the payer receives{' '}
          <strong>{formatUsdc(data.refundable)} USDC</strong> back.
        </p>
      </div>
    </aside>
  );
}
