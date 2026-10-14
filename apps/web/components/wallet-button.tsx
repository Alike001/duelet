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

import { addressUrl, ARC_CHAIN_ID } from '@/lib/chain';
import { shortHash } from '@/lib/finance';

import { CopyIcon, ExternalIcon, WalletIcon } from './icons';

export function WalletButton() {
  const connection = useConnection();
  const connectors = useConnectors();
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [view, setView] = useState<'connect' | 'account'>('connect');
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [checkingWallets, setCheckingWallets] = useState(false);
  const [availableConnectorUids, setAvailableConnectorUids] = useState<
    string[]
  >([]);
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

  async function discoverWallets() {
    setCheckingWallets(true);
    const available = await Promise.all(
      connectors.map(async (connector) => ({
        uid: connector.uid,
        provider: await connector.getProvider().catch(() => undefined),
      })),
    );
    setAvailableConnectorUids(
      available
        .filter((item) => Boolean(item.provider))
        .map((item) => item.uid),
    );
    setCheckingWallets(false);
  }

  function openWallet(nextView: 'connect' | 'account') {
    setView(nextView);
    setMessage('');
    dialog.current?.showModal();
    if (nextView === 'connect') void discoverWallets();
  }

  function closeWallet() {
    dialog.current?.close();
  }

  function connectWallet(connector: (typeof connectors)[number]) {
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
                Choose a browser wallet to view your invoices or prepare a
                payment. Public proof pages do not require a connection.
              </p>
              <div className="wallet-options">
                {checkingWallets ? (
                  <div className="wallet-detection">Checking this browser…</div>
                ) : availableConnectorUids.length ? (
                  connectors
                    .filter((connector) =>
                      availableConnectorUids.includes(connector.uid),
                    )
                    .map((connector) => (
                      <button
                        type="button"
                        onClick={() => connectWallet(connector)}
                        disabled={isPending}
                        key={connector.uid}
                      >
                        <span className="wallet-option-mark">
                          {connector.name.slice(0, 1).toUpperCase()}
                        </span>
                        <span>
                          <strong>
                            {isPending
                              ? 'Check your wallet'
                              : connector.name === 'Injected'
                                ? 'Browser wallet'
                                : connector.name}
                          </strong>
                          <small>Detected in this browser</small>
                        </span>
                        <b>→</b>
                      </button>
                    ))
                ) : (
                  <div className="no-wallet-state">
                    <strong>No browser wallet detected</strong>
                    <p>
                      Install MetaMask or open Duelet in a compatible mobile
                      wallet browser, then try again.
                    </p>
                    <button
                      type="button"
                      onClick={() => void discoverWallets()}
                    >
                      Check again
                    </button>
                  </div>
                )}
              </div>
              <p className="wallet-note">
                Duelet only lists wallets detected in your browser. It does not
                currently offer a QR connection.
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
                <span>Available on Arc</span>
                <strong>{formattedGas} USDC</strong>
                <small>
                  Used for payments and Arc transaction fees.{' '}
                  <a href="/docs#what-arc-contributes">How Arc USDC works</a>
                </small>
              </div>
              {connection.address && (
                <a
                  className="wallet-explorer-link"
                  href={addressUrl(connection.address)}
                  target="_blank"
                  rel="noreferrer"
                >
                  View account on Arc Explorer <ExternalIcon />
                </a>
              )}
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
