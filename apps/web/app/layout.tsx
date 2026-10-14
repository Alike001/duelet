import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import './globals.css';

export const metadata: Metadata = {
  title: 'ArcInvoiceStream',
  description: 'Arc-native invoice-linked USDC streaming escrow.',
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
