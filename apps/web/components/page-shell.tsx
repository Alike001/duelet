import type { ReactNode } from 'react';

import { ModeBanner } from './mode-banner';
import { SiteFooter } from './site-footer';
import { SiteHeader } from './site-header';

export function PageShell({
  children,
  compact = false,
}: {
  children: ReactNode;
  compact?: boolean;
}) {
  return (
    <main className="page-root">
      <SiteHeader />
      <ModeBanner />
      <div
        className={compact ? 'page-content compact-content' : 'page-content'}
      >
        {children}
      </div>
      <SiteFooter />
    </main>
  );
}
