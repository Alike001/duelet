export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl items-center px-6 py-20">
      <section className="space-y-5">
        <p className="text-sm font-semibold tracking-[0.18em] text-neutral-600 uppercase">
          Phase 0 · Specification locked
        </p>
        <h1 className="text-5xl font-semibold tracking-tight">
          ArcInvoiceStream
        </h1>
        <p className="max-w-2xl text-lg leading-8 text-neutral-700">
          An Arc-native, fully funded USDC invoice stream with deterministic
          vesting, vested claims, cancellation refunds, and onchain
          reconciliation.
        </p>
        <p className="text-sm text-neutral-600">
          Production financial logic and wallet actions are intentionally not
          implemented yet.
        </p>
      </section>
    </main>
  );
}
