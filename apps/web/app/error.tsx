'use client';

export default function RouteError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="route-error">
      <span className="empty-orbit" />
      <h1>Something interrupted this view.</h1>
      <p>
        No transaction status has been inferred. Retry the read, or verify the
        contract directly if the RPC remains unavailable.
      </p>
      <button className="button button-dark" onClick={reset} type="button">
        Retry
      </button>
    </main>
  );
}
