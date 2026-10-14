# Phase 4.1 validation record

Date: 2026-10-14  
Branch: `feature/phase-4-1-premium-redesign`  
Baseline: `7b1560e70fb8aae9e83f6891bb2357d66ec47297`

## Release boundaries

- `DueletStream.sol` and the frontend ABI are byte-for-byte unchanged from the
  baseline.
- No mainnet contract was deployed, no transaction was signed or broadcast,
  and no USDC was approved or moved.
- The public Vercel release was not changed.
- The old obligations repository remained at
  `b845dfaa2a437e0aa56537a194c5d3f29396c140` with no working-tree changes.

## Automated results

| Gate                                    | Result                                                                              |
| --------------------------------------- | ----------------------------------------------------------------------------------- |
| Prettier + Forge formatting             | Passed                                                                              |
| ESLint + Forge lint                     | Passed                                                                              |
| Strict TypeScript                       | Passed                                                                              |
| Next.js production build                | Passed; all 8 product routes built                                                  |
| Frontend Vitest                         | 10 passed                                                                           |
| Domain golden fixture                   | 1 passed                                                                            |
| Foundry unit/fuzz/invariant/adversarial | 43 passed; 0 failed                                                                 |
| Arc real-USDC fork at block `25947829`  | 2 passed; 0 failed, explicit `--fork-url`                                           |
| Chromium desktop + Pixel 7 journeys     | 28 passed; 0 failed                                                                 |
| Wallet connection/network mocks         | Connect, reconnect state, disconnect, wrong network, switch recovery passed         |
| Accessibility browser checks            | Keyboard focus, named financial controls, compact navigation, reduced motion passed |
| Horizontal overflow                     | All primary routes passed on desktop and mobile                                     |
| npm audit                               | 0 vulnerabilities                                                                   |
| Repository secret scan                  | Passed                                                                              |
| Git-history secret-pattern scan         | Passed                                                                              |
| `git diff --check`                      | Passed                                                                              |

The browser wallet is an explicit EIP-1193 test double. It validates interface
state and Wagmi event handling without signing. It is not evidence that every
third-party mobile wallet behaves identically.

## Visual evidence

Before and after evidence is stored in:

- `docs/screenshots/phase-4-1/before/`
- `docs/screenshots/phase-4-1/after/`

The after set covers the home, workspace, invoice creation, invoice detail,
proof, wallet selection, connected account, and wrong-network states. Home,
workspace, and creation include both desktop and mobile captures. Each image
was inspected after a real Chromium render; no contract-derived activity was
invented.

## Findings resolved

1. Replaced the immediate first-connector action with a wallet/account sheet,
   address copy, deliberate disconnect, Arc status, network switch, and native
   gas display.
2. Reworked the hero around the financial instrument, established real display
   and interface typography, reduced repetitive cards, and clarified payer and
   recipient roles in the workspace.
3. Corrected event pagination from 25,000 to 9,999 blocks to stay below Arc's
   documented 10,000-block `eth_getLogs` ceiling.
4. Added active navigation, accessible dialog behavior, explicit connector
   failure copy, compact layouts, and reduced-motion coverage.
5. Prepared reproducible Blockscout Standard JSON verification and manual
   evidence procedures without claiming a deployment or verified source.

## Remaining blockers

- Reown AppKit/WalletConnect QR is intentionally unavailable. Stable AppKit
  targets Wagmi 2, the Wagmi 3 adapter is prerelease, a real project ID is
  absent, and the WalletConnect Community License needs explicit acceptance.
- Mainnet wallet address, nonce, live fee read, wallet-specific gas estimates,
  deployment receipt/address/block, Blockscout result, and canary transaction
  evidence remain pending explicit deployment approval.
- The contract is unaudited; tests are not a professional audit.
