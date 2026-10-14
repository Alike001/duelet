import { CreateInvoiceForm } from '@/components/create-invoice-form';
import { PageShell } from '@/components/page-shell';

export default function NewInvoicePage() {
  return (
    <PageShell compact>
      <div className="page-heading">
        <div>
          <p className="eyebrow">New payment schedule</p>
          <h1>Create invoice</h1>
          <p>
            Lock the full USDC amount once. The payee earns it linearly between
            immutable timestamps.
          </p>
        </div>
      </div>
      <CreateInvoiceForm />
    </PageShell>
  );
}
