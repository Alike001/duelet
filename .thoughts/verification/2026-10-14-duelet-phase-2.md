# Verification Audit: Duelet Phase 2

Date: October 14, 2026

Verdict: **Pass for Phase 2 preview and deployment-readiness handoff.** Mainnet
deployment, source verification, live transaction evidence, and production
safety remain explicitly unclaimed.

## Baseline and scope

- Accepted Phase 1 commit:
  `ee560f72e255eafc4a3ba3b01d1a70470080a739`
- Authoritative kernel: `contracts/src/DueletStream.sol`
- Product and risk sources: product, UX, financial, threat, Arc integration,
  and contract API documents
- Phase 2 surfaces: all eight requested routes, shared wallet/configuration
  layer, event discovery, ABI-backed reads and simulations, lifecycle actions,
  browser tests, and screenshot evidence
- Explicit exclusions: deployment, signing, broadcasting, fund movement,
  hosting, and financial-kernel changes

## Requirement traceability

| Requirement                                      | Implementation evidence                                                                                       | Verification evidence                                                                |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Purpose understood within the landing experience | Hero mechanism card, three-step lifecycle, cancellation split, accounting and trust sections                  | Desktop/mobile screenshots; landing browser scenario                                 |
| Explicit predeployment state                     | `deployment` requires a valid address and deployment block; `ModeBanner`; disabled writes                     | Vitest Arc/config assertion; creation and proof browser scenarios                    |
| Exact invoice preparation                        | `CreateInvoiceForm`; six-decimal `bigint` parser; locally hashed/generated references; exact approval         | Finance tests; validation browser scenario; strict TypeScript                        |
| Gas and balance preview                          | Account-specific approval/funding gas estimation, live gas price, unified native balance reserve checks       | Compiler/type checks; preview state remains explicitly unavailable before deployment |
| ABI-backed lifecycle                             | Duelet ABI; simulated `createAndFund`, `withdraw`, and `cancel`; receipt waiting; immutable claim destination | ABI assertions; production compilation; Solidity destination invariant               |
| Current financial state                          | Invoice reads and Solidity-compatible vesting/reconciliation helpers                                          | Four finance tests; shared golden fixture parity                                     |
| Honest invoice discovery                         | Bounded event ranges, strict decoding, deduplication, deployment-block floor, RPC error/empty states          | Event implementation review; browser empty-state scenario                            |
| Judge-facing proof                               | Wallet-independent `/proof/[id]`, accounting identity, evidence labels, transaction/event area                | Proof browser scenario and desktop/mobile screenshots                                |
| Accessibility and responsive behavior            | Semantic controls, labels, focus styles, reduced motion, loading/error/retry states, responsive layouts       | Ten Playwright runs; route overflow assertions; screenshot review                    |
| Contract regression protection                   | No diff to contract source, tests, or fixtures from accepted Phase 1                                          | Git path comparison; local and Arc-specific suites                                   |

## Verification evidence

- Frontend unit/integration: 2 files, 7 tests passed.
- Browser: 5 scenarios on desktop Chrome and 5 on Pixel 7; 10 passed.
- Solidity local suites: 43 tests passed, 0 failed. This count treats the
  invariant suite as one Foundry test while reporting its four invariant
  properties separately.
- Stateful invariants: four properties, 128 runs × 64 calls = 8,192 handler
  calls, zero reverts.
- Arc fork: two cases passed against live mainnet state with Circle Arc Foundry
  `v0.8.0-2` and explicit `--fork-url`. The lifecycle used fork-local cheatcode
  funding only; no mainnet asset was obtained or moved.
- Builds: Next.js 16.4.0 production build, strict TypeScript packages, Solidity
  0.8.37, and domain package build passed.
- Hygiene: Prettier, scoped Foundry formatting, ESLint, Forge lint, secret scan,
  `git diff --check`, generated dependency licenses, and `npm audit` passed;
  npm reported zero known vulnerabilities.

## Visual review

- Landing: strong editorial hierarchy, immediate mechanism explanation,
  visible illustrative labeling, cancellation/accounting story, trust posture,
  and unaudited disclosure.
- Creation: clear three-part form and persistent transaction preview; exact
  allowance and funding are separate steps; generated reference and preview
  constraints are visible.
- Proof: financial values dominate, lifecycle and immutable destination are
  clear, the conservation equation is legible, and illustrative evidence is
  not confused with confirmed onchain data.
- Mobile: cards stack coherently, large figures remain readable, and primary
  routes have no measured horizontal overflow.

Screenshots are stored under `artifacts/screenshots/`.

## Deviations and tool findings

- Raw `forge fmt --check` includes vendored `contracts/lib/forge-std` and
  reports upstream formatting differences. The repository's accepted formatter
  runs `forge fmt --check` from its contracts workspace, whose ignore policy
  scopes the gate to project-owned Solidity. No vendor source was edited.
- Upstream `forge` and an Arc Foundry invocation that only calls
  `vm.createSelectFork` cannot execute Arc's blocklist precompile. Arc Foundry
  passes when Arc mode is selected with the documented `--fork-url`; this exact
  command is now recorded in the integration guide and package script.
- Production writes cannot be end-to-end browser-tested before a verified
  deployment exists. Preview mode deliberately disables them instead of using
  mock positions or a fabricated contract address.

## Residual risks and deployment gates

- The contract remains unaudited; test breadth is not an audit.
- Public RPC history can be rate-limited or incomplete. The UI discloses this,
  retries reads through its query layer, and never describes incomplete event
  discovery as complete history.
- Circle can pause or block USDC transfers, and Arc-specific precompile behavior
  requires Arc Foundry for faithful fork execution.
- The syntactic deployment configuration must still be matched to verified
  bytecode, constructor arguments, chain 5042, and the recorded deployment
  block during the separate deployment-readiness phase.
- Wallet replacement/repricing behavior and exact gas quotes require a real
  configured deployment and wallet-specific simulation before authorization.
- Hosting, public repository publication, live links, and mainnet proof do not
  yet exist.

## Financial-kernel decision

No Solidity or authorization change is proposed. Frontend integration did not
identify a contract API defect. The Phase 1 kernel, tests, and golden fixtures
remain byte-for-byte unchanged from the accepted commit.
