# Spec: Duelet (originally ArcInvoiceStream)

## Objective

Implement, in Phase 1, one non-upgradeable Arc contract that fully funds fixed
USDC invoices and releases their value linearly while preserving exact payer
refund and payee claim rights.

## Current reality

Phase 0 established configuration, documentation, and deterministic fixtures.
Phase 1 now implements those requirements in `DueletStream.sol`. The
authoritative requirements remain in `docs/PRODUCT_SPEC.md` and the exact
accounting model remains in `docs/FINANCIAL_MODEL.md`.

## Goals

- Unique, replay-resistant invoice identity.
- Full upfront escrow and exact balance-delta validation.
- Safe integer linear vesting.
- Permissionless claim triggering to an immutable payee.
- Payer-only cancellation and immediate unvested refund.
- Per-invoice and aggregate solvency.
- Direct onchain recovery without frontend dependence.

## Non-goals

- Fees, governance, proxies, rescue administration, dispute resolution, yield,
  lending, StableFX, recurring debt streams, or third-party streaming contracts.

## Acceptance criteria

- Every requirement and invariant in the product and financial specifications
  has a corresponding Phase 1 test.
- Solidity and TypeScript match the golden fixtures exactly.
- Arc fork behavior uses the official USDC address and timestamp rules.
- No mainnet action occurs without a new explicit approval.

## Constraints

- Mainnet gas is absolutely capped at 1.000000 USDC.
- The planned principal is 10,000 ERC-20 base units.
- The previous obligations repository is out of scope and immutable.
- Sablier source must not be copied.

## Stories needed

- Payer creates and fully funds a valid invoice.
- Any caller triggers a partial-time or final payee claim.
- Payer cancels and receives only the unvested portion.
- Payee claims frozen vested entitlement after cancellation.
- Anyone independently reconciles an invoice from state and events.

## Open questions

No product-shape questions remain for Phase 1. Storage widths, custom error
names, and event parameter indexing are implementation details to settle without
changing the locked economics.
