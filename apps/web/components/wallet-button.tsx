'use client';

import {
  useConnect,
  useConnection,
  useConnectors,
  useDisconnect,
  useSwitchChain,
} from 'wagmi';

import { ARC_CHAIN_ID } from '@/lib/chain';
import { shortHash } from '@/lib/finance';

import { WalletIcon } from './icons';

export function WalletButton() {
  const connection = useConnection();
  const connectors = useConnectors();
  const { mutate: connect, isPending } = useConnect();
  const { mutate: disconnect } = useDisconnect();
  const { mutate: switchChain, isPending: switching } = useSwitchChain();

  if (connection.status !== 'connected') {
    return (
      <button
        className="button button-dark compact"
        type="button"
        disabled={isPending || connectors.length === 0}
        onClick={() =>
          connectors[0] &&
          connect({ connector: connectors[0], chainId: ARC_CHAIN_ID })
        }
      >
        <WalletIcon />{' '}
        {isPending
          ? 'Check wallet'
          : connectors.length
            ? 'Connect wallet'
            : 'Wallet unavailable'}
      </button>
    );
  }

  if (connection.chainId !== ARC_CHAIN_ID) {
    return (
      <button
        className="button button-warning compact"
        type="button"
        disabled={switching}
        onClick={() => switchChain({ chainId: ARC_CHAIN_ID })}
      >
        {switching ? 'Switching…' : 'Switch to Arc'}
      </button>
    );
  }

  return (
    <button
      className="wallet-connected"
      type="button"
      onClick={() => disconnect()}
      aria-label="Disconnect wallet"
    >
      <span className="status-dot" /> {shortHash(connection.address ?? '')}
    </button>
  );
}
