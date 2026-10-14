'use client';

import { createConfig, http } from 'wagmi';
import { injected } from 'wagmi/connectors';

import { arc } from './chain';

export const reownProjectId =
  process.env.NEXT_PUBLIC_REOWN_PROJECT_ID?.trim() || undefined;

export const wagmiConfig = createConfig({
  chains: [arc],
  connectors: [injected({ shimDisconnect: true })],
  transports: { [arc.id]: http() },
  ssr: true,
});
