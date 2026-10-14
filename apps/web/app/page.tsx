export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl items-center px-6 py-20">
      <section className="space-y-5">
        <p className="text-sm font-semibold tracking-[0.18em] text-neutral-600 uppercase">
          Phase 1 · Escrow implemented
        </p>
        <h1 className="text-5xl font-semibold tracking-tight">Duelet</h1>
        <p className="max-w-2xl text-lg leading-8 text-neutral-700">
          Invoice once. Pay over time.
        </p>
        <p className="text-sm text-neutral-600">
          Invoice-linked USDC streaming escrow on Arc. The production frontend
          and wallet transaction flows remain Phase 2 work.
        </p>
      </section>
    </main>
  );
}
