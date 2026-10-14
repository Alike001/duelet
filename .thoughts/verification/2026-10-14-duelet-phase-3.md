# Verification Audit: Duelet Phase 3

Date: October 14, 2026

Verdict: **READY_WITH_BLOCKERS.** The reviewed codebase is suitable for a
minimal 0.010000 USDC canary after the external release gates below are
completed. No critical or high-severity issue remains. It is not deployed or
audited, and no transaction was signed or broadcast.

## Baseline and scope

- Accepted Phase 2 commit:
  `17d5df6cb737557af787174c889f2c5d90b89e4c`
- Financial kernel: `contracts/src/DueletStream.sol`
- Reviewed surfaces: contract and mocks, financial specifications, Arc fork,
  ABI/configuration, all application routes, transaction preparation, event
  discovery, production build, hosting configuration and release materials
- Excluded by instruction: deployment, signing, broadcasting, transfers,
  account access, paid hosting and private-key handling

## Requirement traceability

| Requirement                              | Implementation evidence                                                                                  | Verification evidence                                                                    |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Escrow conservation and immutable payout | Contract liability updates, exact token deltas, no admin/sweep, destination-free `withdraw`              | Unit, adversarial, 5,000 fuzz runs and 25,600 invariant calls                            |
| Real Arc USDC lifecycle                  | Official proxy, immutable constructor, distinct payer/payee, payer-triggered claim                       | Pinned block 25,947,829; two Arc Foundry tests passed with explicit fork URL             |
| Release identity gate                    | Expected runtime hash plus live `USDC()` equality before writes                                          | Integration tests cover match and both mismatch cases                                    |
| Exact approval                           | Funding requires allowance equal to the invoice amount                                                   | Unit cases cover missing, lower, equal and excessive allowance                           |
| Honest event history                     | Deployment-block floor, 25,000-block ranges, strict decoding, deduplication, 20-block confirmation delay | Implementation review and unavailable/empty UI states                                    |
| Numeric parity                           | BigInt six-decimal parsing, `mulDiv`-equivalent floor vesting, shared fixture                            | Frontend tests, Solidity fixture and domain fixture passed                               |
| Production routes                        | Eight routes, dynamic invoice/proof rendering, preview mode, hard-refresh support                        | Next.js production build and 14 Playwright runs passed                                   |
| Responsive and keyboard behavior         | Responsive layouts, focus styles, disclosure and empty states                                            | Desktop/Pixel 7 runs, overflow checks, fresh screenshot review and focus-visible test    |
| Budget and execution control             | Per-transaction gas ledger, 25 gwei ceiling, approval checkpoints                                        | Read-only deployment estimate and live fee observation; wallet fields explicitly pending |

## Findings

- Critical: none identified.
- High: none identified.
- Medium: issuer pause/blocklist can deny lawful transfers without corrupting
  accounting; no professional audit has been performed.
- Low: unsolicited/unsupported token surplus is deliberately unrecoverable;
  guessable metadata hashes can disclose short inputs; public RPC history can
  be unavailable or incomplete.
- Informational: payer cancellation is unilateral before maturity; repeated
  block timestamps do not advance vesting.

The frontend had one low-severity release defect: allowance greater than the
requested amount was accepted as sufficient. It did not change contract
accounting or redirect funds, but it left residual spending authority contrary
to the product's exact-approval promise. Funding now unlocks only for equality,
the UI explains stale excess allowance, and regression tests cover boundaries.

The final fork rerun exposed a second release-build defect: upstream Foundry
could replace the shared artifact, allowing Arc Foundry to skip compilation and
observe a different runtime hash. The fork and release build commands now force
Arc Foundry compilation, making the asserted release hash reproducible. This
did not alter Solidity source or financial behavior.

No financial-contract behavior changed from the accepted Phase 2 baseline.

## Evidence

- Solidity release profile: 43 Foundry test entries passed; five fuzz
  properties ran 1,000 cases each; four stateful invariants ran 256 × 100 =
  25,600 calls; 13 adversarial cases passed.
- Pinned Arc fork: 2/2 passed using Circle Arc Foundry `v0.8.0-2`, mainnet block
  `25947829` and fork-local funding only.
- Frontend/domain: 9 Vitest cases and one Node fixture test passed.
- Browser: 7 desktop Chrome plus 7 Pixel 7 scenarios passed, including hard
  refresh, visible keyboard focus and horizontal-overflow checks.
- Build: Next.js production output generated all static and dynamic routes;
  Solidity 0.8.37 compiled successfully.
- Bytecode: runtime 6,216 bytes; initcode 6,603 bytes; Arc-configured runtime
  hash `0xf4ad4b494fd7d609868ae5737d5840ee903b001767718cba4f249309ff84606f`.
- Dependencies: `npm audit --audit-level=high` reported zero vulnerabilities.
- Hygiene: formatting, lint, strict typecheck, secret scan and diff checks
  passed.
- Static-analysis limitation: Slither, Semgrep, Aderyn and Solhint were not
  installed and are not represented as passed. Manual review and Forge lint
  were completed, but they are not substitutes for an audit.

## Visual review

Fresh production renders were inspected on desktop and Pixel 7. The landing
page states the mechanism, funding, vesting, claim trigger, cancellation result
and Arc role without requiring a wallet. The create flow preserves readable
amounts and addresses on mobile, labels preview mode, separates approval from
funding, and warns that metadata hashes are public and guessable. No visible
overflow, clipped controls, misleading onchain evidence or fabricated metrics
were observed. Updated create-route captures are in `artifacts/screenshots/`.

## Release blockers

1. The expected funding, payer and payee public addresses are unknown.
2. The payer has not received the expected Arc USDC.
3. Wallet-specific nonces, balances, fees and simulations are pending.
4. The contract is not deployed, source-verified or proven by receipts.
5. Vercel and public GitHub publication require the user's authorized accounts.
6. Application address/block variables must remain unset until bytecode and
   immutable constructor state are independently verified.
7. The project remains unaudited; only the minimal canary is recommended.

## Decision

The repository passes Phase 3 engineering verification. Release execution must
follow `docs/MAINNET_RELEASE_RUNBOOK.md`, remain within
`docs/MAINNET_BUDGET.md`, stop at every approval checkpoint, and preserve
preview mode until confirmed deployment evidence exists.
