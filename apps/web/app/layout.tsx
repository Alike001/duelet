import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import type { ReactNode } from 'react';

import { Providers } from '@/components/providers';

import './globals.css';
import './final-theme.css';

const sans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
});

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
      <body className={sans.variable}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
