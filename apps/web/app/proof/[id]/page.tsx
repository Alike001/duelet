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
        <p className="page-kicker">Payment receipt</p>
        <h1>Public payment proof</h1>
        <p>
          Verify the funding, withdrawals, refunds, and remaining escrow without
          connecting a wallet.
        </p>
      </div>
      <InvoiceView requestedId={id} proof />
    </PageShell>
  );
}
