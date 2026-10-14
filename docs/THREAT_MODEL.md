# Threat model

Status: Phase 0 design review; no production contract exists

## Protected assets and properties

- Every funded invoice's Arc USDC escrow.
- The payer's right to the unvested cancellation refund.
- The payee's irrevocable vested entitlement.
- Uniqueness and integrity of invoice references.
- Exact per-invoice and aggregate liability accounting.
- Public ability to reconcile state with confirmed Arc transactions.

## Trust boundaries

- The contract trusts Arc consensus for transaction ordering and timestamps.
- It trusts the configured Arc USDC contract to implement token transfers and
  accepts Circle's pause, blocklist, and upgrade authority as external risk.
- It does not trust the frontend, indexer, RPC response, payer, payee, claim
  caller, arbitrary ERC-20 sender, or contract deployer with escrow authority.
- No admin, proxy controller, keeper, oracle, or backend is part of V1.

## Threats and required controls

| Threat                            | Consequence                               | Required control and evidence                                                           |
| --------------------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------- |
| Invoice ID replay                 | Duplicate obligation or ambiguous proof   | Domain-separated ID plus explicit existence mapping; replay tests                       |
| Cross-chain/deployment replay     | Same identifier reused in another context | Bind `block.chainid` and `address(this)`                                                |
| Reference collision               | Wrong invoice reconciled                  | Nonzero `bytes32` reference hash and Keccak-derived ID                                  |
| Unauthorized cancellation         | Payee loses future vesting                | Exact `msg.sender == payer` check                                                       |
| Redirected claim                  | Caller steals vested funds                | Destination is immutable payee; no recipient argument                                   |
| Overwithdrawal/double claim       | Insolvency                                | Derive full current claimable from vested minus withdrawn; effects before transfer      |
| Double cancellation/refund        | Insolvency                                | Nonzero `canceledAt` guard and atomic state update                                      |
| Reentrancy during funding         | Duplicate or underfunded invoice          | `nonReentrant`, ID reservation before transfer, exact balance delta                     |
| Reentrancy during payout/refund   | Repeated transfer                         | `nonReentrant` and checks-effects-interactions                                          |
| Fee-on-transfer/nonstandard token | Underfunded invoice                       | Immutable allowlisted USDC plus exact balance-delta check and SafeERC20                 |
| Timestamp assumptions             | Unexpected vesting                        | Seconds-based math; boundary and same-timestamp-block tests                             |
| Multiplication overflow           | Incorrect vesting                         | OpenZeppelin `Math.mulDiv` with downward rounding                                       |
| Cross-invoice contamination       | One invoice consumes another's funds      | Per-invoice delta checks and aggregate solvency invariant                               |
| Admin compromise                  | Escrow drain                              | No owner, upgrade, rescue, fee, or arbitrary call path                                  |
| Frontend compromise               | Malicious transaction presentation        | Show chain, target, function, amount, and explorer proof; direct contract recovery docs |
| RPC/indexer compromise            | False state or receipt                    | Receipt confirmation and direct state reads; indexer is non-authoritative               |
| USDC pause/blocklist              | Transfers fail or funds freeze            | Atomic reverts, disclosure, tests where feasible; no false recovery claim               |
| Accidental direct transfer        | Unowned surplus                           | Exclude surplus from liabilities; no V1 sweep                                           |

## Required Phase 1 tests

### Identity and schedule

- Same payer/reference replay reverts.
- Same reference from distinct payers derives distinct IDs.
- IDs differ across chain or contract context in deterministic harnesses.
- Zero reference, zero payee, payer-as-payee, zero amount, historical start,
  equal start/end, and end-before-start revert.
- `startTime == block.timestamp`, future start, and start-now sentinel succeed.

### Vesting and withdrawal

- Zero vested before and at start.
- Exact floor rounding at every boundary vector.
- Full amount at end.
- Multiple partial-time withdrawals sum to no more than vested.
- Withdrawal with zero current claimable reverts.
- No possible caller can overwithdraw or select a recipient.
- Permissionless callers always pay the immutable payee.
- Two blocks with the same timestamp produce no extra vesting.

### Cancellation and refund

- Non-payer cancellation reverts.
- Cancellation before start refunds everything.
- Cancellation during vesting refunds exactly the unvested amount.
- Cancellation after prior withdrawals preserves remaining vested entitlement.
- Cancellation one second before maturity obeys floor rounding.
- Cancellation at/after maturity and double cancellation revert.
- Claims after cancellation never exceed the frozen vested amount.

### Token interaction and reentrancy

- Funding, withdrawal, and cancellation token failures revert all accounting.
- Exact contract and wallet balance deltas are asserted.
- Fee-on-transfer funding is rejected.
- Reentrant funding, withdrawal, and cancellation attempts fail.
- USDC pause/blocklist behavior is exercised on a controllable mock and on an
  Arc fork where the real implementation permits safe simulation.

### Solvency and integration

- Stateful invariant:
  `balance >= aggregateOutstandingLiability` after every successful action.
- Stateful invariant: aggregate equals the sum of all invoice liabilities.
- Randomized cross-invoice operations cannot transfer another invoice's funds.
- Direct token donations create surplus without changing claims.
- Solidity and TypeScript results match every golden fixture.
- Arc fork tests verify the real address, decimals, allowance, transfer, and
  same-timestamp assumptions.

## Operational controls

- Deployment bytecode, constructor arguments, chain ID, USDC address, and
  compiler settings must be published before mainnet approval.
- Simulate every mainnet transaction immediately before signature.
- Use exact allowances for the canary and verify allowance consumption.
- Do not intentionally broadcast reverting transactions to test failures.
- Keep cumulative irreversible mainnet gas below the approved ledger.
- Describe the contract as unaudited until an independent audit is complete.

## Residual risks

- Contract defects may still exist after tests and review.
- Circle can freeze accounts or change token behavior through its authority.
- Arc timestamps need not advance between blocks.
- A payer can cancel future vesting without offchain dispute resolution.
- Lost payer/payee keys cannot be recovered by the contract.
- Surplus and unsupported tokens are intentionally unrecoverable in V1.
