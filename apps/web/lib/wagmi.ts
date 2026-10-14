'use client';

import { createConfig, http } from 'wagmi';
import { injected, walletConnect } from 'wagmi/connectors';

import { arc } from './chain';
import { isValidReownProjectId } from './wallet';

const configuredProjectId =
  process.env.NEXT_PUBLIC_REOWN_PROJECT_ID?.trim() ?? '';

export const walletConnectEnabled = isValidReownProjectId(configuredProjectId);

const walletConnectors = [
  injected({ shimDisconnect: true }),
  ...(walletConnectEnabled
    ? [
        walletConnect({
          projectId: configuredProjectId,
          metadata: {
            name: 'Duelet',
            description: 'Invoice-linked USDC streaming escrow on Arc.',
            url: 'https://duelet.vercel.app',
            icons: ['https://duelet.vercel.app/icon.svg'],
          },
          showQrModal: true,
          isNewChainsStale: true,
          qrModalOptions: {
            themeMode: 'light',
            enableMobileFullScreen: true,
            themeVariables: {
              '--wcm-accent-color': '#6655E8',
              '--wcm-background-border-radius': '20px',
              '--wcm-container-border-radius': '20px',
            },
          },
        }),
      ]
    : []),
];

export const wagmiConfig = createConfig({
  chains: [arc],
  connectors: walletConnectors,
  multiInjectedProviderDiscovery: true,
  transports: { [arc.id]: http() },
  ssr: true,
});
