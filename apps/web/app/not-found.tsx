import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="route-error">
      <span className="empty-orbit" />
      <h1>That page is not part of this invoice.</h1>
      <p>Return to the workspace or open a known invoice ID.</p>
      <Link className="button button-dark" href="/app">
        Open workspace
      </Link>
    </main>
  );
}
