# Verification Audit: Duelet Phase 1

Date: October 14, 2026

Verdict: **Pass**, subject to the explicitly deferred security review and
deployment-readiness gates below.

## Artifacts checked

- Accepted Phase 0 commit: `592a1e4a885d1fd6cae4a46365a1d46c81958aaa`
- Product, financial, threat, Arc integration, UX, and grant specifications
- `contracts/src/DueletStream.sol`
- Unit, fuzz, invariant, adversarial, and Arc fork test suites
- Shared JSON fixture and TypeScript fixture test
- Foundry configuration, npm workspace scripts, and CI workflow
- Contract API, validation record, dependency licenses, and root README

## Requirement traceability

| Requirement                                        | Implementation evidence                                       | Verification evidence                                                          |
| -------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Unique invoice and replay resistance               | `computeInvoiceId`, `invoiceExists`                           | Unit duplicate-reference and payer-domain tests; fuzz replay test              |
| Full exact upfront escrow                          | `createAndFund`, SafeERC20, before/after balance delta        | Unit exact-funding tests; adversarial fee/no-op/false-return tests             |
| Immutable payer, payee, amount, schedule, metadata | `Invoice` written once at creation                            | Unit creation/readback and invalid-input tests                                 |
| Linear floor-rounded vesting                       | `_vestedAmount` with `Math.mulDiv`                            | Unit boundaries; 256-run amount/duration fuzz properties; golden fixture       |
| Permissionless claims only to payee                | `withdraw` has no recipient or amount argument                | Unit third-party trigger; invariant destination tracking; reentrancy tests     |
| Payer-only cancellation before maturity            | `cancel` authorization and maturity checks                    | Unit unauthorized, double, before-start, after-withdrawal, near-maturity tests |
| Immediate unvested refund and frozen vested right  | cancellation state update and exact transfer                  | Golden fixture; cancellation fuzzing; cancellation entitlement invariant       |
| Per-invoice conservation                           | `invoiceLiability`                                            | Unit reconciliation and stateful conservation invariant                        |
| Aggregate liability coverage                       | `totalOutstandingLiability`, `isSolvent`                      | Multi-invoice unit tests and stateful solvency invariant                       |
| Failure atomicity                                  | `nonReentrant`, checks-effects-interactions, revert semantics | Reentrant callbacks; failed/malformed/fee transfers; pause/blocklist mocks     |
| Real Arc compatibility                             | chain guard, official USDC address, Arc profile               | Official Arc Foundry fork against chain 5042 and live USDC code                |
| Frontend-independent recovery                      | public write/read API                                         | Contract API documents direct wallet and block-explorer access                 |

## Acceptance-criteria coverage

- The complete create → partial claim → cancel/refund → final claim lifecycle
  passes with the shared 10,000-unit deterministic fixture.
- Solidity and TypeScript both produce 1,000 units vested at 18 seconds, 3,333
  at 60 seconds, a 6,667-unit refund, and a 2,333-unit final claim.
- Two same-timestamp blocks do not create additional vesting.
- Three concurrently manipulated invoices retain independent liabilities and
  immutable destinations under stateful invariant testing.
- The real-USDC fork lifecycle passes using fork-local test funding only.

## Quality gates

- Formatting: Prettier and `forge fmt --check`
- Static lint: ESLint, TypeScript, and `forge lint --deny warnings`
- Compilation: strict TypeScript, Next.js production build, Solidity 0.8.37
- Tests: 46 Solidity cases plus the TypeScript golden-fixture test
- Stateful campaign: four invariants over 128 runs × 64 shared handler calls
- Repository hygiene: dependency audit, license report, secret scan, and
  `git diff --check`

## Deliberate deviations and decisions

- `ARC_INVOICE_STREAM_V1` remains the protocol identity after the Duelet
  rebrand so invoice derivation is stable and branding cannot silently change
  financial identifiers.
- The constructor is configurable for isolated testing and non-Arc reuse, but
  chain 5042 strictly accepts only Arc's official USDC address.
- Transfer events are emitted after successful token movement so no success log
  can survive a failed transfer. `nonReentrant` prevents callback reordering;
  the two corresponding linter exceptions are local and justified in source.
- Root Prettier excludes Solidity because Foundry is its authoritative
  formatter; the repository check invokes both formatters.

## Gaps and residual risks

- This is unaudited software. Passing tests are not a professional audit.
- Slither and Semgrep were not installed, so neither was represented as run.
- Arc USDC remains subject to Circle pause, blocklist, proxy, and issuer risks.
- Accidental direct USDC transfers become visible surplus and are intentionally
  unrecoverable because V1 has no privileged sweep authority.
- Second-granularity timestamps permit consecutive blocks with equal vesting.
- Gas estimates are read-only estimates, not receipts or execution guarantees.
- Wallet-specific simulation, deployment-address verification, source
  verification, and the mainnet canary require separate explicit approval.

## Follow-ups

- Phase 2: implement the premium Next.js routes, wallet flows, transaction
  previews, onchain receipt proof, and calculation parity against the ABI.
- Deployment readiness: repeat live fee estimation, simulate every exact
  wallet transaction, enforce the 1 USDC ledger, and obtain explicit approval.
- Before material funds: commission an independent Solidity security review.

## Evidence log

- `forge build --sizes`: passed; runtime 6,216 bytes, initcode 6,603 bytes.
- Official Circle Arc Foundry full suite: 46 passed, 0 failed, 0 skipped.
- Real Arc mainnet fork suite: official six-decimal USDC lifecycle passed.
- `npm audit --audit-level=high`: zero known vulnerabilities at validation time.
- `npm run check`: formatting, lint, types, builds, tests, secret scan, and diff
  hygiene passed at the final Phase 1 revision.
