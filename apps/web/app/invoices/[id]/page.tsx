import { InvoiceView } from '@/components/invoice-view';
import { PageShell } from '@/components/page-shell';

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <PageShell compact>
      <InvoiceView requestedId={id} />
    </PageShell>
  );
}
