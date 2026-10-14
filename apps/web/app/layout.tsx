import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { Providers } from '@/components/providers';

import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Duelet — Invoice once. Pay over time.',
    template: '%s · Duelet',
  },
  description:
    'Create a USDC invoice, fund its payment schedule, and let recipients claim what they have earned over time.',
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
