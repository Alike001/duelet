# Phase 0 validation record

Date: October 14, 2026

## Environment

- Node.js: 24.14.1
- npm: 11.13.0
- Foundry: 1.7.1
- Solidity configured: 0.8.37
- Foundry EVM target: Osaka

## Completed checks

| Check                          | Result                 | Scope                                                            |
| ------------------------------ | ---------------------- | ---------------------------------------------------------------- |
| `npm install`                  | Passed                 | Installed pinned workspace lockfile                              |
| `npm audit --audit-level=high` | Passed                 | Zero known vulnerabilities after dependency correction           |
| `npm run format:check`         | Passed                 | Prettier plus Foundry formatting                                 |
| `npm run lint`                 | Passed                 | TypeScript ESLint, domain strict check, Foundry lint             |
| `npm run typecheck`            | Passed                 | Next.js and domain strict TypeScript                             |
| `npm run build`                | Passed                 | Static Next.js route, domain declarations, empty Foundry project |
| `npm test`                     | Passed                 | One Phase 0 golden-fixture specification test                    |
| `forge test`                   | Passed with zero tests | Production Solidity and tests intentionally do not exist yet     |
| `forge config --json`          | Passed                 | Paths, Solidity 0.8.37, Osaka, optimizer, RPC alias verified     |
| `npm run secret:scan`          | Passed                 | Repository files; no secret-like assignments found               |
| `git diff --check`             | Passed                 | No whitespace errors in unstaged changes                         |

The single Node test validates only the deterministic fixture arithmetic. It is
not a contract test, audit, Arc integration test, or production feature count.

## Not implemented or tested yet

- `ArcInvoiceStream.sol` and its ABI.
- Solidity unit, fuzz, invariant, reentrancy, permission, or token-failure
  tests.
- Arc fork tests against the real USDC interface.
- Compiled contract size or target deployment-gas estimate.
- Wallet connection, transaction construction, simulation, or receipts.
- Required application routes beyond the Phase 0 home placeholder.
- Mainnet deployment, verification, or funded canary.
- Independent security review or professional audit.

These are Phase 1 or later deliverables and must not be inferred from the Phase
0 validation results.
