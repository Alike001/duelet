# Duelet wallet integration decision

Status: Final wallet upgrade, 2026-10-15. No wallet transaction was signed or
broadcast during this work.

## Decision

Duelet keeps its verified Wagmi `3.7.7`, Viem `2.57.6`, and TanStack Query
`5.104.2` connection and transaction stack. Its wallet sheet supports injected
EIP-1193 wallets and uses Wagmi's EIP-6963 discovery for named providers such as
MetaMask and Rabby. WalletConnect QR/mobile sessions are enabled through
Wagmi's official connector; Duelet does not use the AppKit React adapter.

Wagmi 3 provides an official `walletConnect` connector, so AppKit is not needed
for QR connections. The connector uses the owner-provided public Reown project
ID through `NEXT_PUBLIC_REOWN_PROJECT_ID` and the pinned
`@walletconnect/ethereum-provider` `2.26.0` peer dependency.

The inspected current provider release, `2.26.0`, uses the WalletConnect
Community License Agreement dated 20 August 2025 rather than MIT. Downloading,
installing, integrating, or using it constitutes acceptance. Distribution
requires the Reown copyright notice, a copy of that license, and applicable
branding; use must connect to Reown's network; commercial terms apply above the
stated RPC/MAU thresholds; and the agreement includes binding arbitration. The
project owner explicitly accepted those terms before installation. The required
notice appears in the root README and an exact license copy is stored at
`docs/licenses/WALLETCONNECT_COMMUNITY_LICENSE.md`.

The optional public environment variable remains reserved:

```text
NEXT_PUBLIC_REOWN_PROJECT_ID=<public Reown project ID>
```

A project ID is public client configuration, not a wallet secret. Missing or
malformed values omit the WalletConnect connector rather than exposing a broken
choice.

## Current wallet experience

- Accessible native dialog with Escape dismissal and trigger-focus restoration.
- EIP-6963 discovery with provider names/icons where announced, a
  MetaMask-compatible legacy injected fallback, and duplicate suppression.
- WalletConnect's hosted QR/mobile chooser, session persistence, and explicit
  disconnect through the same Wagmi provider tree.
- Clear no-wallet installation/mobile guidance and human-readable rejection
  messages.
- Connected address, copy action, intentional disconnect, and refresh
  reconnection through Wagmi.
- Arc mainnet status and a `Switch to Arc mainnet` recovery action.
- One Arc-native USDC balance display. It is not duplicated as a second ERC-20
  balance; six-decimal invoice accounting remains separate in payment views.
- Public invoices and proof pages remain readable without connecting.
- Preview mode and deployment-identity checks continue to disable writes.

## WalletConnect release properties

- The connector is compiled only for a syntactically valid project ID.
- Its metadata identifies Duelet and `https://duelet.vercel.app`.
- Arc mainnet (`eip155:5042`) is the only configured chain.
- The Duelet dialog closes before the hosted QR modal opens, preventing native
  top-layer conflicts.
- WalletConnect never bypasses chain `5042`, runtime hash, immutable USDC,
  simulation, preview-mode, or receipt-confirmation guards.
- Production domain allowlisting remains controlled in the Reown project
  dashboard; a QR initialization test verifies the current project accepts the
  configured application.

## Sources inspected

- Wagmi connect-wallet guide: <https://wagmi.sh/react/guides/connect-wallet>
- Wagmi WalletConnect connector:
  <https://wagmi.sh/react/api/connectors/walletConnect>
- Published npm manifests for Wagmi `3.7.7`, `@wagmi/connectors` `8.2.0`, and
  `@walletconnect/ethereum-provider` `2.26.0`.
- The `2.26.0` provider archive's `LICENSE.md` (WalletConnect Community License
  Agreement, release date 20 August 2025).
