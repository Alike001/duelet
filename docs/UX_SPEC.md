# UX specification

## Experience principles

- Lead with the real invoice stream, not ecosystem slogans or invented metrics.
- Use the same financial facts for beginner and advanced views.
- Make payer cancellation rights and payee vested rights visible before signing.
- Separate estimates from confirmed onchain state.
- Never display fake APY, TVL, transaction volume, users, profits, or safety
  claims.
- Provide a direct-contract recovery path when the frontend is unavailable.

## Future navigation and routes

```text
/
/app
/invoices
/invoices/new
/invoices/[id]
/activity
/proof/[id]
/docs
```

Phase 2 implements every route below in explicit preview mode. Contract reads,
event discovery, transaction simulation, and writes activate only when a valid
verified deployment address and deployment block are supplied through public
configuration. No mainnet deployment is claimed.

## `/` — landing page

The hero demonstrates one authentic invoice stream using live or clearly
labeled deterministic data:

- Fixed invoice total.
- Payer and payee.
- Start/end schedule.
- Vested, withdrawn, refundable, and remaining values.
- A visible timeline that advances in whole timestamp seconds.
- A compact explanation: fund once, vest over time, claim, or cancel the future
  portion.

Below the hero:

1. Payer and payee paths.
2. The exact fund-to-exit lifecycle.
3. Cancellation split demonstration.
4. Onchain reconciliation proof.
5. Risks and issuer limitations.
6. Contract, source, documentation, and explorer links.

Visual direction is restrained financial software: warm neutral canvas, precise
typography, strong numeric alignment, one action accent, amber for warnings, and
red only for destructive or failed states. It must not clone Request or Sablier
branding, icons, illustrations, or layouts.

## `/app` — workspace overview

- Connected wallet and Arc-network status.
- Role-aware counts: payable, receivable, claimable, refundable.
- Immediate actions without invented portfolio values.
- Clear empty state directing users to create or locate an invoice.
- Stale RPC and wrong-network states block writes but preserve read-only proof.

## `/invoices`

- Tabs for payer and payee roles.
- Filters for scheduled, streaming, completed, and canceled derived states.
- Invoice ID, reference hash, counterparty, total, claimable/refundable amount,
  and confirmed timestamp.
- No backend-only invoice may appear as paid or funded.

## `/invoices/new`

- Payee address with checksum and payer-distinct validation.
- Human invoice reference hashed locally with a preview of `referenceHash` and
  resulting predicted ID.
- Amount displayed as USDC and exact six-decimal base units.
- Start-now or future-start control; immutable end timestamp.
- Metadata hash field without uploading private documents by default.
- Approval preview followed by creation/funding preview.
- Explicit cancellation consequences and transaction cost budget.
- Final review shows chain, contract, token, spender, amount, schedule, payer,
  payee, and expected events.

## `/invoices/[id]`

- Derived lifecycle state and second-granularity vesting progress.
- Total, vested, withdrawn, claimable, refunded, and liability reconciliation.
- Payer action: cancel while eligible, with exact projected vested/refund split.
- Permissionless action: trigger full current claimable payout to immutable
  payee; the destination is visible and cannot be edited.
- Events and receipt status with Arc explorer links.
- Advanced panel: raw base units, timestamps, reference/metadata hashes, caller,
  contract address, and calculation inputs.

## `/activity`

- Confirmed creation, withdrawal, and cancellation events.
- Pending transactions remain visually separate from confirmed history.
- Every entry exposes transaction hash, block, log index, caller, affected
  invoice, and token delta.
- Same-timestamp blocks are ordered by block number and log index, not time
  alone.

## `/proof/[id]`

A public, wallet-independent reconciliation page containing:

- Invoice identity and immutable terms.
- Current derived amounts from direct contract reads.
- Chronological confirmed events.
- Accounting equation showing total equals withdrawn plus refunded plus current
  liability.
- Contract/source/explorer links and an explicit “not an audit” disclosure.

## `/docs`

- How invoices work.
- Formula and rounding.
- Cancellation and recovery.
- Arc USDC and gas units.
- Contract interaction without the frontend.
- Risks, issuer controls, and unaudited status.

## Transaction states

Every write uses: review → wallet confirmation → submitted → confirmed or
failed → post-state reconciliation. A successful `eth_call` or simulation is
never presented as a transaction. Wallet rejection, dropped/replaced
transactions, RPC disagreement, allowance changes, USDC restrictions, and
budget exceedance each receive explicit states.

## Mobile behavior

- Financial totals and eligible defensive actions appear before charts.
- Transaction review is a full-height sheet with no hidden destination.
- Long hashes have copy and explorer actions without horizontal page overflow.
- Tables become labeled rows; accounting relationships remain visible.
