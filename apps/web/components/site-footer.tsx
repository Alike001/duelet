import Link from 'next/link';

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div>
        <span className="brand footer-brand">Duelet</span>
        <p>Invoice-linked USDC streaming escrow on Arc.</p>
      </div>
      <div className="footer-links">
        <Link href="/docs">Documentation</Link>
        <span>Source link pending</span>
        <span>Unaudited software</span>
      </div>
      <p className="footer-legal">
        Duelet does not custody funds outside its immutable escrow rules. Circle
        can pause or block USDC transfers.
      </p>
    </footer>
  );
}
