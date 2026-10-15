'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useConnection } from 'wagmi';

import { ArrowIcon } from '@/components/icons';
import { InvoiceRegistry } from '@/components/invoice-registry';
import { PageShell } from '@/components/page-shell';
import { deployment } from '@/lib/chain';

const filters = [
  'All',
  'Created by me',
  'Payable to me',
  'Active',
  'Completed',
  'Canceled',
];

export default function InvoicesPage() {
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const connection = useConnection();
  return (
    <PageShell compact>
      <div className="page-heading">
        <div>
          <p className="page-kicker">Payment records</p>
          <h1>My invoices</h1>
          <p>
            Invoices you funded or receive, filtered by your connected wallet.
            This is a personal view of public onchain records.
          </p>
        </div>
        <Link className="button button-accent" href="/invoices/new">
          Create payment <ArrowIcon />
        </Link>
      </div>
      <div className="filter-bar" role="group" aria-label="Invoice filters">
        {filters.map((item) => (
          <button
            className={filter === item ? 'active' : ''}
            key={item}
            onClick={() => setFilter(item)}
            type="button"
          >
            {item}
          </button>
        ))}
        <label className="invoice-search">
          <span className="sr-only">Search invoices</span>
          <input
            placeholder="Invoice ID or reference hash"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
      </div>
      <section className="panel invoice-list-panel">
        <div className="list-head">
          <span>Invoice</span>
          <span>Counterparty</span>
          <span>Status</span>
          <span>Amount</span>
          <span>Claimable</span>
        </div>
        <InvoiceRegistry
          filter={filter}
          search={search}
          wallet={connection.address}
        />
      </section>
      <p className="index-note">
        <strong>Index coverage:</strong>{' '}
        {deployment.mode === 'preview'
          ? 'not started — no verified contract or deployment block configured.'
          : `bounded from configured deployment block ${deployment.block?.toString()}; public RPC retries and deduplication enabled.`}
      </p>
    </PageShell>
  );
}
