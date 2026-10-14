# ArcInvoiceStream

ArcInvoiceStream is an independent Arc-native invoice-linked USDC streaming
escrow. The approved product combines referenced invoice reconciliation with a
fully funded, fixed-duration linear stream.

Phase 0 establishes the repository, locks the financial specification, and
configures validation. The production `ArcInvoiceStream.sol` contract is
deliberately not implemented yet.

## Workspace

- `apps/web` — future Next.js application.
- `contracts` — Foundry project for the future Solidity contract.
- `packages/domain` — future pure TypeScript financial math and ABI helpers.
- `fixtures` — shared deterministic financial vectors.
- `docs` — product, accounting, security, Arc, UX, and grant documentation.

## Commands

```bash
npm install
npm run format:check
npm run lint
npm run typecheck
npm run build
npm test
npm run secret:scan
npm run check
```

No mainnet transaction is authorized by this repository setup.
