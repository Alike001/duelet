# Product specification: Duelet

Status: implemented financial specification; mainnet deployment pending

Target contract: `DueletStream.sol`

Production implementation status: implemented and tested locally in Phase 1;
not deployed

## Objective

Duelet is an independent Arc-native escrow for fixed-amount USDC
invoices that vest linearly over an immutable time window. It combines a
Request-style unique payment reference with a Sablier Lockup-style fully funded
stream. Our contract, rather than a third-party streaming deployment, will own
invoice existence, escrow, vesting, withdrawal, cancellation, refund, and
reconciliation accounting.

## Users and roles

### Payer

- Creates an invoice using a unique reference hash.
- Funds the complete immutable amount during creation.
- May cancel an active invoice before its end time.
- Immediately receives the unvested portion when cancellation succeeds.
- Cannot recover vested funds.

### Payee

- Is immutable for an invoice and must differ from the payer in V1.
- Owns every vested unit, whether or not it has been withdrawn.
- Receives withdrawals directly; no caller can redirect funds.
- Does not need the web application to recover funds.

### Claim caller

- Any address may trigger withdrawal of the complete currently claimable
  amount for an invoice.
- The caller never selects the recipient or amount and receives no fee.
- This role has no authority over the invoice or escrow.

## Real use cases

- A client funds a fixed contractor invoice that accrues during a delivery
  period.
- A grant payer funds a milestone-independent linear disbursement and retains a
  defined cancellation right over future, unvested funds.
- A merchant or service provider shares an invoice proof page whose payment,
  vesting, claims, and cancellation can be reconciled directly on Arc.

Duelet V1 is not payroll automation, recurring billing, credit,
lending, yield generation, arbitration, or conditional milestone escrow.

## Invoice identity

The caller supplies a nonzero `bytes32 referenceHash`, normally computed as
`keccak256` over a canonical offchain invoice reference. The raw reference and
private invoice data are not stored onchain.

The contract derives:

```text
domain = keccak256("ARC_INVOICE_STREAM_V1")
invoiceId = keccak256(
  abi.encode(domain, block.chainid, address(this), msg.sender, referenceHash)
)
```

This binds the identifier to the versioned domain, Arc chain, deployed contract,
payer, and unique reference. `invoiceExists[invoiceId]` is explicit. Creation
reverts if it is already true. Therefore, one payer cannot submit the same
reference twice to one deployment, while different payers may independently use
the same offchain reference.

## Stored invoice fields

- `payer`
- `payee`
- `totalAmount`
- `withdrawnAmount`
- `refundedAmount`
- `startTime`
- `endTime`
- `canceledAt`
- `metadataHash`

Existence is tracked separately. There is no mutable lifecycle-status enum.
Views derive whether an invoice is scheduled, streaming, completed, or canceled
from immutable times, `canceledAt`, and the financial fields. This avoids state
drift between a status variable and the actual accounting.

## Creation rules

- `msg.sender` is the payer; V1 cannot fund on behalf of another payer.
- Payer is necessarily nonzero under EVM call semantics.
- Payee must be nonzero and different from the payer.
- `referenceHash` must be nonzero.
- Amount must be nonzero and fit the selected storage width without truncation.
- `requestedStartTime == 0` means “start now”; the stored start is the current
  `block.timestamp` from the successful creation transaction.
- A nonzero requested start must be greater than or equal to the transaction's
  `block.timestamp`. Historical starts are rejected.
- End must be strictly greater than the resolved start.
- Future starts are allowed. A start equal to the current timestamp is allowed.
- Amount, stored start, end, payer, payee, reference, and metadata hash never
  change after creation.

Creation reserves the invoice ID and increases aggregate liability before the
external token call, then calls `safeTransferFrom`. It verifies that the
contract's USDC balance increased by exactly `totalAmount`. Any failure or
fee-on-transfer discrepancy reverts the entire transaction, including the
existence flag and liability change. A successful invoice therefore always
starts fully funded.

## Lifecycle

```text
nonexistent
  -> atomically funded scheduled/streaming invoice
  -> zero or more permissionless claim triggers
  -> either normal maturity or payer cancellation before maturity
  -> final payee claim
  -> zero invoice liability
```

Normal completion is not represented as cancellation. Cancellation is allowed
only while `block.timestamp < endTime` and `canceledAt == 0`.

## Withdrawal

`withdraw(invoiceId)` computes the current vested amount and transfers the
entire `vestedAmount - withdrawnAmount` to the immutable payee. It reverts when
that value is zero. Calling before maturity produces a partial stream payout;
calling at or after maturity produces a full remaining payout. V1 intentionally
has no caller-selected withdrawal amount.

Every payout verifies both the contract's exact balance decrease and the
recipient's exact balance increase. A token behavior that short-pays either a
claim or refund reverts the complete state transition.

Anyone may call it because permissionless triggering improves recovery and does
not expand spending authority. Payee-only withdrawal would force the payee to
obtain Arc gas even when the payer is already funded. Permissionless triggering
lets the payer or a relayer pay gas while the USDC can only reach the payee.

## Cancellation

Only the immutable payer may cancel, and only before normal maturity. The
contract calculates vesting at the transaction timestamp, sets `canceledAt`,
records the exact refund, reduces aggregate liability, and transfers the
unvested amount to the payer. If the transfer fails, all effects revert.

- Before or at start: vested is zero and the entire amount is refunded.
- During vesting: unvested funds are refunded and vesting freezes.
- At or after end: cancellation is rejected; the stream completed normally.
- Previous withdrawals do not alter the vested calculation.
- Vested but unwithdrawn funds remain claimable by the payee after cancellation.
- Cancellation cannot occur twice.

## Reconciliation

Public views expose the stored invoice, derived phase, vested amount, claimable
amount, invoice liability, and aggregate outstanding liability. Events record
creation, withdrawals, and cancellation/refund. The proof UI must reconcile
events with current contract state and link every confirmed action to the Arc
explorer.

The chain is authoritative. A backend or indexer may accelerate discovery but
must not define balances or entitlements.

## Requirements

1. Support multiple invoices without cross-invoice accounting interference.
2. Store no mutable lifecycle enum.
3. Hold only fully funded Arc USDC obligations.
4. Use `block.timestamp` seconds, never block counts, for vesting.
5. Preserve payee entitlement through cancellation and frontend failure.
6. Expose sufficient views and events for independent reconciliation.
7. Include no fees, proxy, governance, token, arbitrary admin withdrawal,
   StableFX, or external streaming dependency.

## Implemented contract surface

Phase 1 implements `createAndFund`, `withdraw`, `cancel`, `vestedAmount`,
`claimableAmount`, `refundableAmount`, `getInvoice`, deterministic ID
calculation, derived invoice status, per-invoice liability, aggregate liability,
solvency, and surplus views. `InvoiceCreated`, `FundsWithdrawn`, and
`InvoiceCanceled` provide reconciliation evidence.

The complete signatures, event fields, terminology, and frontend-independent
recovery path are documented in [CONTRACT_API.md](./CONTRACT_API.md).

## Honest limitations

- The contract will be unaudited unless and until an independent audit occurs.
- Arc validators determine timestamps; timestamps are non-decreasing and two
  blocks may share one timestamp.
- USDC can be paused or addresses can be blocked by its issuer. This can prevent
  funding, withdrawal, or refund without corrupting contract accounting.
- Cancellation is unilateral payer authority over only the unvested amount; V1
  has no dispute resolver or milestone evidence.
- A mistaken payee, amount, or schedule cannot be edited after creation.
- Direct unsolicited USDC is surplus and cannot be recovered in V1.
- The contract generates no yield and makes no APY, profitability, or safety
  guarantee.

## Acceptance criteria for later implementation

- Solidity and TypeScript reproduce every shared golden fixture exactly.
- Every authorized state transition preserves invoice and aggregate solvency.
- A payee can recover all lawful entitlement by direct contract interaction.
- A third-party claim caller cannot redirect or overdraw funds.
- Failed token interactions leave all invoice accounting unchanged.
- Fork tests use the real Arc USDC interface and Arc timestamp behavior.
- Mainnet activity occurs only after explicit user approval and produces real
  explorer-verifiable receipts.

## Sources

- [Request ERC20FeeProxy](https://github.com/RequestNetwork/requestNetwork/blob/master/packages/smart-contracts/src/contracts/ERC20FeeProxy.sol)
- [Sablier Lockup overview](https://docs.sablier.com/concepts/lockup/overview)
- [Arc contract addresses](https://docs.arc.io/arc/references/contract-addresses.md)
- [Arc EVM differences](https://docs.arc.io/arc/references/evm-differences.md)
