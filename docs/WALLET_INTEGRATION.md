# Duelet wallet integration decision

Status: Phase 4.1 decision, 2026-10-14. No wallet transaction was signed or
broadcast during this work.

## Decision

Duelet keeps its existing Wagmi 3 connection and transaction stack for this
release. It now presents a purpose-built wallet sheet for injected EIP-1193
wallets, including MetaMask and compatible mobile wallet browsers. Reown AppKit
and WalletConnect QR are not enabled yet.

This is deliberate:

- Duelet uses Wagmi `3.7.7`, Viem `2.57.6`, and TanStack Query `5.104.2`.
- The current stable `@reown/appkit` release is `1.8.24`, and Reown's stable
  installation documentation currently specifies Wagmi 2.x. Reown publishes
  `@reown/appkit-adapter-wagmi@2.0.0-wagmi-3.0` with peer ranges of Wagmi
  `>=3.0.0`, Viem `>=2.55.13`, `@wagmi/core >=3.0.0`, and
  `@wagmi/connectors >=8.0.0`, but it is a prerelease rather than the stable
  integration path.
- WalletConnect needs a real Reown project ID. None is stored in the repository
  and Duelet must not invent one.
- The current `@walletconnect/ethereum-provider` package uses the WalletConnect
  Community License Agreement, not MIT. Its terms and notices need an explicit
  project decision before it is added to Duelet's dependency inventory.
- Downgrading Wagmi would replace a verified transaction stack immediately
  before financial release. A prerelease adapter would create the same risk in
  a different direction.

The optional public environment variable is reserved now:

```text
NEXT_PUBLIC_REOWN_PROJECT_ID=
```

A project ID is public client configuration, not a wallet secret. Its presence
alone does not enable QR connections; the compatible adapter must also pass the
same account, chain, simulation, deployment-identity, and receipt tests as the
current flow.

## Current wallet experience

- Branded connect button and accessible native dialog.
- Injected wallet discovery with clear no-wallet and rejection messages.
- Connected address, copy action, disconnect, and reconnection through Wagmi.
- Arc mainnet status and a `Switch to Arc mainnet` action.
- Native Arc gas balance labeled separately from six-decimal ERC-20 USDC
  accounting.
- Public invoices and proof pages remain readable without connecting.
- Preview mode and deployment-identity checks continue to disable writes.

## AppKit activation gate

Reconsider AppKit only after all of the following are true:

1. A real Reown project ID is available.
2. Reown documents a stable Wagmi 3 adapter, or the prerelease is explicitly
   accepted after a pinned compatibility test.
3. WalletConnect dependency terms and redistribution notices are accepted and
   recorded in `docs/DEPENDENCY_LICENSES.md`.
4. One provider context replaces—not duplicates—the existing provider tree.
5. Desktop QR, mobile deep-link, reconnect, account-change, chain-change,
   rejection, and preview-lock browser tests pass.
6. Financial writes remain gated by chain `5042`, expected runtime hash,
   immutable Arc USDC, simulation, and confirmed receipts.

## Sources inspected

- Reown AppKit Next installation:
  <https://docs.reown.com/appkit/next/core/installation>
- Reown custom networks:
  <https://docs.reown.com/appkit/next/core/custom-networks>
- Reown Arc guide:
  <https://reown.com/blog/how-to-get-started-with-reown-on-arc-network-using-appkit-cli>
- Wagmi connector documentation: <https://wagmi.sh/react/api/connectors>
- Published npm package manifests and license files for the candidate Reown and
  WalletConnect versions.
