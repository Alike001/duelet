'use client';

import { useEffect, useRef, useState } from 'react';
import { formatUnits } from 'viem';
import {
  useBalance,
  useConnect,
  useConnection,
  useConnectors,
  useDisconnect,
  useSwitchChain,
} from 'wagmi';

import { ARC_CHAIN_ID } from '@/lib/chain';
import { shortHash } from '@/lib/finance';
import { reownProjectId } from '@/lib/wagmi';

import { CopyIcon, WalletIcon } from './icons';

export function WalletButton() {
  const connection = useConnection();
  const connectors = useConnectors();
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [view, setView] = useState<'connect' | 'account'>('connect');
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const { mutate: connect, isPending, error: connectionError } = useConnect();
  const { mutate: disconnect } = useDisconnect();
  const {
    mutate: switchChain,
    isPending: switching,
    error: switchError,
  } = useSwitchChain();
  const gasBalance = useBalance({
    address: connection.address,
    chainId: ARC_CHAIN_ID,
    query: { enabled: connection.status === 'connected' },
  });

  useEffect(() => {
    if (!dialog.current?.open) return;
    setView(connection.status === 'connected' ? 'account' : 'connect');
  }, [connection.status]);

  function openWallet(nextView: 'connect' | 'account') {
    setView(nextView);
    setMessage('');
    dialog.current?.showModal();
  }

  function closeWallet() {
    dialog.current?.close();
  }

  function connectInjected() {
    const connector = connectors.find((item) => item.id === 'injected');
    if (!connector) {
      setMessage(
        'No browser wallet was detected. Install MetaMask or open Duelet inside a compatible wallet browser.',
      );
      return;
    }
    setMessage('');
    connect(
      { connector, chainId: ARC_CHAIN_ID },
      {
        onSuccess: () => closeWallet(),
        onError: (error) =>
          setMessage(
            error.message.includes('rejected')
              ? 'Connection was rejected in the wallet.'
              : `Connection failed: ${error.message}`,
          ),
      },
    );
  }

  async function copyAddress() {
    if (!connection.address) return;
    await navigator.clipboard.writeText(connection.address);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1_500);
  }

  const isConnected = connection.status === 'connected';
  const wrongNetwork = isConnected && connection.chainId !== ARC_CHAIN_ID;
  const formattedGas = gasBalance.data
    ? formatNativeBalance(gasBalance.data.value)
    : '—';

  return (
    <div className="wallet-control">
      <button
        ref={trigger}
        className={wrongNetwork ? 'wallet-trigger wrong' : 'wallet-trigger'}
        type="button"
        onClick={() => openWallet(isConnected ? 'account' : 'connect')}
        aria-haspopup="dialog"
      >
        <WalletIcon />
        <span>
          <small>
            {wrongNetwork
              ? 'Wrong network'
              : isConnected
                ? 'Arc mainnet'
                : 'Wallet'}
          </small>
          <strong>
            {isConnected ? shortHash(connection.address ?? '') : 'Connect'}
          </strong>
        </span>
      </button>
      <dialog
        className="wallet-dialog"
        ref={dialog}
        aria-labelledby="wallet-dialog-title"
        onClick={(event) => {
          if (event.target === dialog.current) closeWallet();
        }}
        onClose={() => {
          setMessage('');
          window.setTimeout(() => trigger.current?.focus(), 0);
        }}
      >
        <div className="wallet-sheet">
          <div className="wallet-sheet-head">
            <div>
              <p className="eyebrow">Arc payment wallet</p>
              <h2 id="wallet-dialog-title">
                {view === 'account' ? 'Wallet details' : 'Connect to Duelet'}
              </h2>
            </div>
            <button
              className="modal-close"
              type="button"
              onClick={closeWallet}
              aria-label="Close wallet dialog"
            >
              ×
            </button>
          </div>

          {view === 'connect' ? (
            <>
              <p className="wallet-intro">
                Connect only to inspect your role or prepare a transaction.
                Public invoices and proof pages never require a wallet.
              </p>
              <div className="wallet-options">
                <button
                  type="button"
                  onClick={connectInjected}
                  disabled={isPending}
                >
                  <span className="wallet-option-mark">M</span>
                  <span>
                    <strong>
                      {isPending
                        ? 'Check your wallet'
                        : 'MetaMask or browser wallet'}
                    </strong>
                    <small>Extension or compatible mobile wallet browser</small>
                  </span>
                  <b>→</b>
                </button>
                <button
                  type="button"
                  disabled
                  aria-describedby="walletconnect-note"
                >
                  <span className="wallet-option-mark qr">⌁</span>
                  <span>
                    <strong>WalletConnect QR</strong>
                    <small>
                      {reownProjectId
                        ? 'Project ID found; adapter remains intentionally disabled'
                        : 'Available after a Reown project ID is configured'}
                    </small>
                  </span>
                  <b>Pending</b>
                </button>
              </div>
              <p className="wallet-note" id="walletconnect-note">
                Duelet keeps its verified Wagmi 3 stack. Reown AppKit's stable
                adapter targets Wagmi 2; the Wagmi 3 adapter remains prerelease.
              </p>
            </>
          ) : (
            <div className="account-sheet">
              <div className="account-identity">
                <span
                  className={wrongNetwork ? 'account-orb wrong' : 'account-orb'}
                />
                <div>
                  <span>
                    {wrongNetwork
                      ? 'Unsupported network'
                      : 'Connected to Arc mainnet'}
                  </span>
                  <strong>{shortHash(connection.address ?? '', 8)}</strong>
                </div>
              </div>
              <button
                className="copy-address"
                type="button"
                onClick={copyAddress}
              >
                <code>{connection.address}</code>
                <span>
                  <CopyIcon /> {copied ? 'Copied' : 'Copy'}
                </span>
              </button>
              <div className="wallet-balance">
                <span>Native gas balance</span>
                <strong>{formattedGas} USDC</strong>
                <small>
                  18-decimal native precision · separate from six-decimal
                  invoice accounting
                </small>
              </div>
              {wrongNetwork && (
                <button
                  className="button button-accent"
                  type="button"
                  disabled={switching}
                  onClick={() =>
                    switchChain(
                      { chainId: ARC_CHAIN_ID },
                      {
                        onError: (error) =>
                          setMessage(`Network switch failed: ${error.message}`),
                      },
                    )
                  }
                >
                  {switching ? 'Confirm in wallet…' : 'Switch to Arc mainnet'}
                </button>
              )}
              <button
                className="disconnect-button"
                type="button"
                onClick={() => {
                  disconnect();
                  closeWallet();
                }}
              >
                Disconnect wallet
              </button>
            </div>
          )}

          {(message || connectionError || switchError) && (
            <p className="wallet-error" role="alert">
              {message || connectionError?.message || switchError?.message}
            </p>
          )}
          <div className="wallet-safety">
            <span>Duelet never asks for a seed phrase.</span>
            <span>
              Writes stay locked until the deployment identity is verified.
            </span>
          </div>
        </div>
      </dialog>
    </div>
  );
}

function formatNativeBalance(value: bigint) {
  const [whole, fraction = ''] = formatUnits(value, 18).split('.');
  const visibleFraction = fraction.slice(0, 6).replace(/0+$/, '');
  return visibleFraction
    ? `${BigInt(whole).toLocaleString()}.${visibleFraction}`
    : `${BigInt(whole).toLocaleString()}.00`;
}
