import type { DueletActivity } from './events';

/** Display filtering only: Arc records remain publicly readable. */
export function invoicesForWallet(activity: DueletActivity[], wallet?: string) {
  if (!wallet) return [];
  const address = wallet.toLowerCase();
  const seen = new Set<string>();
  return activity.filter((event) => {
    const id = event.invoiceId.toLowerCase();
    if (event.type !== 'created' || seen.has(id)) return false;
    seen.add(id);
    return (
      event.payer?.toLowerCase() === address ||
      event.payee?.toLowerCase() === address
    );
  });
}

export function activityForWallet(activity: DueletActivity[], wallet?: string) {
  const ids = new Set(
    invoicesForWallet(activity, wallet).map((event) =>
      event.invoiceId.toLowerCase(),
    ),
  );
  // A third party may trigger a claim; ownership follows the invoice, not caller.
  return activity.filter((event) => ids.has(event.invoiceId.toLowerCase()));
}
