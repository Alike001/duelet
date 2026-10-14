import Link from 'next/link';

import { WalletButton } from './wallet-button';

const nav = [
  ['/app', 'Workspace'],
  ['/invoices', 'Invoices'],
  ['/activity', 'Activity'],
  ['/docs', 'Docs'],
] as const;

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link className="brand" href="/" aria-label="Duelet home">
        <span className="brand-mark">
          <i />
          <i />
        </span>
        <span>Duelet</span>
      </Link>
      <nav aria-label="Primary navigation">
        {nav.map(([href, label]) => (
          <Link href={href} key={href}>
            {label}
          </Link>
        ))}
      </nav>
      <WalletButton />
    </header>
  );
}
