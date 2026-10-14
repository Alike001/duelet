import { InvoiceView } from '@/components/invoice-view';
import { PageShell } from '@/components/page-shell';

export default async function ProofPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <PageShell compact>
      <div className="proof-intro">
        <p className="eyebrow">Independent verification</p>
        <h1>Invoice proof</h1>
        <p>
          Wallet-independent contract state, event evidence, and accounting
          reconciliation for reviewers.
        </p>
      </div>
      <InvoiceView requestedId={id} proof />
    </PageShell>
  );
}
