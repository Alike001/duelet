# Financial model

Status: locked for Phase 1 implementation

Accounting asset: Arc USDC ERC-20 base units, 6 decimals

## Units

All contract amounts are unsigned integers denominated in the 6-decimal Arc
USDC ERC-20 interface. One USDC is `1_000_000` contract units. Gas is separate:
Arc native USDC gas accounting uses 18 decimals even though both interfaces
share one underlying balance.

No formula may mix 6-decimal ERC-20 units with 18-decimal native gas units.

## Time model

For invoice `i`, define:

```text
cancelBound(i) = canceledAt if canceledAt != 0 else +infinity
effectiveTime(i, t) = min(t, endTime, cancelBound(i))
duration = endTime - startTime
```

The explicit `canceledAt != 0` branch is mandatory. Zero is the “not canceled”
sentinel and must never be treated as an actual cancellation time.

Arc timestamps have whole-second EVM granularity and are non-decreasing, not
strictly increasing. Two consecutive blocks with the same timestamp produce the
same vested amount.

## Linear vesting

For effective time `e`:

```text
vested(i, t) = 0                                      when e <= startTime
vested(i, t) = totalAmount                            when e >= endTime
vested(i, t) = floor(totalAmount * (e-startTime)
                     / (endTime-startTime))           otherwise
```

The implementation will use OpenZeppelin `Math.mulDiv` with downward rounding
to avoid intermediate multiplication overflow. The final base-unit remainder
does not vest early; on an uncanceled invoice it becomes vested at `endTime`.
For a canceled invoice, vesting freezes at the floored amount calculated at its
cancellation second.

## Derived balances

```text
claimable = vested(i, now) - withdrawnAmount
invoiceLiability = totalAmount - withdrawnAmount - refundedAmount
unvestedAtCancellation = totalAmount - vested(i, cancelTime)
remainingPayeeEntitlementAfterCancellation =
  vested(i, cancelTime) - withdrawnAmount
```

Subtractions must be safe by invariant, not unchecked assumptions.

## State transitions

### Create and fund

Preconditions:

- The derived invoice ID does not exist.
- Payee, reference, amount, and schedule pass validation.
- Payer allowance and balance cover the exact amount.

Effects and interaction:

```text
exists[id] = true
invoice.totalAmount = amount
aggregateOutstandingLiability += amount
safeTransferFrom(payer, contract, amount)
require(postBalance - preBalance == amount)
emit InvoiceCreated(...)
```

Reentrancy protection covers the complete operation. A revert rolls back every
effect, so partially funded or reserved invoices cannot persist.

### Withdraw current claimable

```text
amount = vested(i, now) - withdrawnAmount
require(amount > 0)
withdrawnAmount += amount
aggregateOutstandingLiability -= amount
safeTransfer(payee, amount)
emit FundsWithdrawn(id, caller, payee, amount, withdrawnAmount)
```

The caller cannot supply an amount or destination.

### Cancel

```text
require(msg.sender == payer)
require(canceledAt == 0)
require(block.timestamp < endTime)
vestedAtCancellation = vested(i, block.timestamp)
refund = totalAmount - vestedAtCancellation
canceledAt = block.timestamp
refundedAmount = refund
aggregateOutstandingLiability -= refund
safeTransfer(payer, refund)
emit InvoiceCanceled(...)
```

Because cancellation is rejected at or after maturity, `refund` is positive for
a valid cancellation. A failed transfer reverts the timestamp and accounting.

## Monetary invariants

For every invoice:

```text
withdrawnAmount <= vestedAmount
withdrawnAmount + refundedAmount <= totalAmount
invoiceLiability = totalAmount - withdrawnAmount - refundedAmount
invoiceLiability >= 0
```

For a canceled invoice:

```text
refundedAmount = totalAmount - vestedAmountAtCancellation
invoiceLiability = vestedAmountAtCancellation - withdrawnAmount
```

For all invoices:

```text
aggregateOutstandingLiability = sum(invoiceLiability(i))
USDC.balanceOf(address(this)) >= aggregateOutstandingLiability
```

The balance may exceed liability because anyone can transfer USDC directly to
the contract. Surplus must never be credited to an invoice or used to mask an
underfunded invoice in tests.

## Multiple-invoice isolation

Every transition changes only its target invoice and the corresponding exact
aggregate delta. One invoice's withdrawal or refund cannot read or consume
another invoice's allocation. Aggregate solvency is checked as a global
invariant across randomized interleavings of create, withdraw, and cancel.

## Failure semantics

- Failed funding reverts invoice existence and liability creation.
- Failed withdrawal reverts `withdrawnAmount` and aggregate reduction.
- Failed refund reverts `canceledAt`, `refundedAmount`, and aggregate reduction.
- A paused or blocklisted USDC path may prevent a transfer, but cannot convert a
  failed action into a successful accounting update.
- Reentrant funding, withdrawal, or cancellation reverts at the guard.
- There is no admin drain or rescue path.

## Unsolicited assets

- Direct Arc USDC transfers create surplus:
  `balance - aggregateOutstandingLiability`.
- V1 has no surplus sweep. Surplus remains permanently in the contract unless a
  later separately reviewed migration design is approved.
- Unsupported ERC-20 tokens sent to the contract are not accounted and cannot
  be recovered.
- Contract entry points are nonpayable, but forced native balance changes must
  still be treated as surplus rather than invoice funding.

This choice prevents an administrator from disguising an escrow drain as asset
recovery.

## Golden example

```text
totalAmount = 10,000 base units
duration = 180 seconds
elapsed = 60 seconds

vestedAmount = floor(10,000 * 60 / 180) = 3,333
unvestedAmount = 10,000 - 3,333 = 6,667
```

After a claim of 1,000 units, cancellation at exactly 60 seconds yields:

```text
withdrawn before cancellation = 1,000
refunded to payer = 6,667
remaining payee entitlement = 3,333 - 1,000 = 2,333
final withdrawn total = 1,000 + 2,333 = 3,333
final accounting = 3,333 + 6,667 = 10,000
```

These are ERC-20 base units: `10,000` is `0.010000 USDC`, not ten thousand
USDC. The vector uses a deterministic test clock. A mainnet demonstration must
not assume a transaction lands exactly 60 seconds after start.

## Boundary examples

- `t == startTime`: zero vested.
- `t == startTime + 1`: `floor(total / duration)` vested.
- Two blocks at the same `t`: identical vested and the second claim reverts if
  the first already withdrew all claimable units.
- Cancellation before the start: full refund, zero payee entitlement.
- `t == endTime`: full vesting and cancellation rejected.
- Completion after earlier withdrawals: `totalAmount - withdrawnAmount`
  remains claimable.
