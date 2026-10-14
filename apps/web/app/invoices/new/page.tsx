import { CreateInvoiceForm } from '@/components/create-invoice-form';
import { PageShell } from '@/components/page-shell';

export default function NewInvoicePage() {
  return (
    <PageShell compact>
      <div className="page-heading">
        <div>
          <p className="page-kicker">New payment</p>
          <h1>Compose payment</h1>
          <p>
            Set the recipient, amount, and schedule. Review every term before
            any wallet request appears.
          </p>
        </div>
      </div>
      <CreateInvoiceForm />
    </PageShell>
  );
}
