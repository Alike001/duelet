# Duelet wallet integration decision

Status: Final wallet upgrade, 2026-10-15. No wallet transaction was signed or
broadcast during this work.

## Decision

Duelet keeps its verified Wagmi `3.7.7`, Viem `2.57.6`, and TanStack Query
`5.104.2` connection and transaction stack. Its wallet sheet supports injected
EIP-1193 wallets and uses Wagmi's EIP-6963 discovery for named providers such as
MetaMask and Rabby. Reown AppKit and WalletConnect QR are not enabled.

Wagmi 3 provides an official `walletConnect` connector, so AppKit is not needed
for a future QR connection. That connector needs a real Reown project ID and
the optional `@walletconnect/ethereum-provider` peer dependency. No project ID
is stored in this repository and Duelet does not invent one.

The inspected current provider release, `2.26.0`, uses the WalletConnect
Community License Agreement dated 20 August 2025 rather than MIT. Downloading,
installing, integrating, or using it constitutes acceptance. Distribution
requires the Reown copyright notice, a copy of that license, and applicable
branding; use must connect to Reown's network; commercial terms apply above the
stated RPC/MAU thresholds; and the agreement includes binding arbitration. The
project owner has not accepted those terms, so the dependency was not installed.

The optional public environment variable remains reserved:

```text
NEXT_PUBLIC_REOWN_PROJECT_ID=
```

A project ID is public client configuration, not a wallet secret. Its presence
alone does not enable QR connections.

## Current wallet experience

- Accessible native dialog with Escape dismissal and trigger-focus restoration.
- EIP-6963 discovery with provider names/icons where announced, a
  MetaMask-compatible legacy injected fallback, and duplicate suppression.
- Clear no-wallet installation/mobile guidance and human-readable rejection
  messages.
- Connected address, copy action, intentional disconnect, and refresh
  reconnection through Wagmi.
- Arc mainnet status and a `Switch to Arc mainnet` recovery action.
- One Arc-native USDC balance display. It is not duplicated as a second ERC-20
  balance; six-decimal invoice accounting remains separate in payment views.
- Public invoices and proof pages remain readable without connecting.
- Preview mode and deployment-identity checks continue to disable writes.

## WalletConnect activation gate

Add Wagmi's `walletConnect` connector only after all of the following are true:

1. A real Reown project ID is available.
2. The project owner explicitly accepts the WalletConnect Community License,
   including its network, attribution, threshold, and dispute terms.
3. Redistribution notices and the applicable license are added and recorded in
   `docs/DEPENDENCY_LICENSES.md`.
4. `@walletconnect/ethereum-provider` is pinned to a Wagmi 3-compatible version
   and the connector is included only when the project ID is nonempty.
5. Desktop QR, mobile deep-link, reconnect, account-change, chain-change,
   rejection, and preview-lock browser tests pass.
6. Financial writes remain gated by chain `5042`, expected runtime hash,
   immutable Arc USDC, simulation, and confirmed receipts.

## Sources inspected

- Wagmi connect-wallet guide: <https://wagmi.sh/react/guides/connect-wallet>
- Wagmi WalletConnect connector:
  <https://wagmi.sh/react/api/connectors/walletConnect>
- Published npm manifests for Wagmi `3.7.7`, `@wagmi/connectors` `8.2.0`, and
  `@walletconnect/ethereum-provider` `2.26.0`.
- The `2.26.0` provider archive's `LICENSE.md` (WalletConnect Community License
  Agreement, release date 20 August 2025).
