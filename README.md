# Duelet

**Invoice once. Pay over time.**

Duelet is an invoice-linked USDC streaming escrow on Arc. A payer creates an
invoice reference, escrows the complete amount, and releases it linearly to an
immutable payee. The payer may cancel before maturity, immediately recovering
only the unvested portion; every vested unit remains claimable by the payee.

The non-upgradeable [`DueletStream.sol`](contracts/src/DueletStream.sol)
contract independently owns invoice identity, escrow, vesting, claims,
cancellation refunds, and aggregate liability accounting. It does not deploy
or route funds through Request Network or Sablier contracts.

## Current phase

Phase 2 implements the complete product application around the tested Solidity
mechanism: invoice creation, wallet and chain checks, contract reads,
transaction preparation, event discovery, lifecycle actions, and independent
proof. It remains in explicit preview mode because nothing in this repository
has been deployed to mainnet.

## Workspace

- `apps/web` — Next.js product application and browser tests.
- `contracts` — Foundry contract, mocks, unit, fuzz, invariant, adversarial, and
  Arc fork tests.
- `packages/domain` — strict TypeScript configuration and shared fixture checks.
- `fixtures` — shared deterministic financial vectors.
- `docs` — product, accounting, security, Arc, UX, and grant documentation.

## Validation

```bash
npm install
npm run check
```

Run the real Arc fork suite with Circle's Arc Foundry distribution:

```bash
ARC_MAINNET_RPC_URL=https://rpc.mainnet.arc.io \
  FOUNDRY_PROFILE=arc arc-forge test --root contracts \
  --match-contract DueletStreamArcForkTest
```

Fork funding uses local cheatcode state only. It never acquires or moves
mainnet USDC. No deployment, broadcast, signing, or fund movement is authorized
by these commands.
