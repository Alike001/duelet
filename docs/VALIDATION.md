# Phase 1 validation record

Date: October 14, 2026

## Environment

- Node.js: 24.14.1
- npm: 11.13.0
- Circle Arc Foundry: `v0.8.0-2`, commit
  `d497beea7096ff2a8e583c8b307941f24a61b06b`
- Upstream Foundry: 1.7.1
- Solidity: 0.8.37
- EVM output target: Osaka
- Arc execution profile: `network = "arc"`

The Arc Foundry archive was downloaded from Circle's official release and
verified against its published SHA-256 before use.

## Solidity evidence

| Suite       |  Cases | Execution evidence                                     |
| ----------- | -----: | ------------------------------------------------------ |
| Unit        |     21 | Identity, schedules, vesting, claims, cancellation     |
| Fuzz        |      6 | Five 256-run properties plus maximum-amount boundary   |
| Invariant   |      4 | 128 runs × 64 calls; 8,192 shared handler calls        |
| Adversarial |     13 | Reentrancy, token failures, issuer controls, donations |
| Arc fork    |      2 | Real mainnet USDC configuration and complete lifecycle |
| **Total**   | **46** | Zero failed and zero skipped under Arc Foundry         |

The Arc fork lifecycle used the official USDC proxy and implementation, native
USDC transfer precompile, and blocklist precompile. Test funding was created by
a local cheatcode after the fork and never existed on mainnet.

The 8,192-handler-call campaign evaluates four invariants after every run. The
stateful invariants prove aggregate liability equality and coverage,
per-invoice conservation, no overwithdrawal or over-refund, frozen cancellation
entitlement, and immutable withdrawal destinations across three concurrent
invoices.

## Build and accounting evidence

- Runtime bytecode: `6,216` bytes.
- Initcode: `6,603` bytes.
- Live read-only Arc deployment estimate: `1,436,821` gas.
- Shared Solidity fixture: 18-second full 1,000-unit claim, 60-second
  cancellation, 6,667-unit refund, and 2,333-unit final claim.
- Shared TypeScript fixture: the same values using `BigInt` floor division.

## Repository quality gates

| Check                                | Result |
| ------------------------------------ | ------ |
| `npm install` / lockfile resolution  | Passed |
| `npm audit --audit-level=high`       | Passed |
| `npm run format:check`               | Passed |
| `npm run lint`                       | Passed |
| `npm run typecheck`                  | Passed |
| `npm run build`                      | Passed |
| `npm test`                           | Passed |
| `forge build --sizes`                | Passed |
| `forge fmt --check`                  | Passed |
| Arc Foundry full test suite          | Passed |
| Arc Foundry real-USDC fork lifecycle | Passed |
| Repository secret scan               | Passed |
| `git diff --check`                   | Passed |

## Honest limitations

- Tests and review are not a professional security audit.
- No contract is deployed or verified on Arc mainnet.
- Gas figures are estimates, not receipts or guarantees.
- Wallet-specific transaction simulations remain a deployment-readiness gate.
- The application routes and wallet transaction UI remain Phase 2 work.
- Circle can pause USDC, block addresses, or change the implementation through
  its external authority.
