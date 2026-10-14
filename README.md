# Duelet

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**Invoice once. Pay over time.**

Duelet is an invoice-linked USDC streaming escrow for Arc. A payer records an
invoice reference, deposits the complete payment once, and the immutable payee
earns that escrow linearly between fixed timestamps. Before maturity, the payer
can cancel future vesting: unvested USDC returns immediately while every earned
unit remains claimable.

Duelet is currently **not deployed**. The application runs in explicit preview
mode and all writes remain locked until a configured Arc deployment matches the
approved runtime bytecode and immutable USDC address. The contracts are
unaudited.

## Financial mechanism

`DueletStream.sol` independently implements deterministic invoice identity,
atomic full-value escrow, floor-rounded linear vesting, permissionless claims
to the stored payee, payer-only cancellation refunds, and aggregate liability
accounting. There is no owner, proxy, fee, governance, arbitrary call or escrow
sweep.

```text
deposit = withdrawn + refunded + remaining liability
contract USDC balance >= aggregate outstanding liability
```

For the shared 0.010000 USDC example, 1,000 base units vest at 18 seconds. At
60 seconds, 3,333 units are vested; cancellation returns 6,667 units and leaves
2,333 units for the payee after the first claim.

## Why Arc

Arc mainnet uses USDC as its native gas asset while exposing the canonical USDC
ERC-20 interface at `0x3600000000000000000000000000000000000000` with six
decimals. Duelet settles an invoice and pays transaction fees in the same
dollar-denominated asset while keeping native 18-decimal gas and six-decimal
contract accounting separate.

## Supported product surface

- Explicitly illustrative landing-page vesting and cancellation model.
- Payer/payee workspace and event-derived invoice discovery.
- Exact-allowance invoice creation and funding flow.
- Invoice state, permissionless claims and payer cancellation.
- Confirmed activity and explorer links.
- Shareable proof page reconstructing the accounting identity.
- Direct-contract recovery documentation if the frontend is unavailable.

## Architecture

- `contracts` — Solidity 0.8.37, OpenZeppelin and Arc Foundry.
- `apps/web` — Next.js 16, React 19, Wagmi, viem and TanStack Query.
- `packages/domain` — shared TypeScript constants and fixture checks.
- `fixtures` — deterministic Solidity/TypeScript financial vectors.
- `docs` — product, threat, release, deployment and grant evidence.

## Local development

Requirements: Node.js 24, npm 11, upstream Foundry, and Circle Arc Foundry
`v0.8.0-2` for faithful Arc execution.

```bash
npm ci
npm run dev --workspace @duelet/web
```

Copy `.env.example` to an ignored local file if configuration is needed. Never
add a deployment address until its code and constructor state are verified.

## Validation

```bash
npm run check
npm run e2e --workspace @duelet/web
ARC_MAINNET_RPC_URL=https://rpc.mainnet.arc.io \
  npm run test:arc-fork --workspace @duelet/contracts
npm audit --audit-level=high
```

The fork suite is pinned to Arc mainnet block `25947829`. Fork balances and
transactions are local test state, not mainnet evidence.

## Deployment and evidence

No broadcast is authorized by this repository. Follow
[`docs/MAINNET_RELEASE_RUNBOOK.md`](docs/MAINNET_RELEASE_RUNBOOK.md). After a
real deployment, reviewers should verify the chain, receipt, runtime code hash,
`USDC()` immutable, invoice events, current state and `/proof/[id]` accounting.

The public application URL and contract address remain intentionally blank.

## Security and limitations

- Duelet is extensively tested but not professionally audited.
- Circle can pause USDC, block addresses or upgrade its implementation.
- A restricted payee may be unable to claim until issuer controls change.
- Public RPC history can be incomplete; contract reads remain authoritative.
- Payers may cancel future vesting without an onchain dispute process.
- Lost wallet keys cannot be recovered.
- Direct surplus and unsupported tokens are intentionally unrecoverable.

See [`docs/RELEASE_SECURITY_REVIEW.md`](docs/RELEASE_SECURITY_REVIEW.md) and
[`docs/MAINNET_BUDGET.md`](docs/MAINNET_BUDGET.md).

## License

Original Duelet source code is available under the [MIT License](LICENSE),
copyright 2026 Duelet contributors. Third-party components retain their own
licenses and notices; they are not relicensed by Duelet. Dependency declarations
and applicable notices are recorded in
[`docs/DEPENDENCY_LICENSES.md`](docs/DEPENDENCY_LICENSES.md) and
[`THIRD_PARTY_LICENSES.md`](THIRD_PARTY_LICENSES.md).
