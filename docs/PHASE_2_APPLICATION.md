# Phase 2 application

Status: implemented, verified locally, not deployed

## Product surface

- `/` explains the product through an explicitly illustrative live vesting
  model, cancellation split, Arc settlement model, and contract trust model.
- `/app` is a wallet-aware workspace with honest disconnected and empty states.
- `/invoices/new` validates invoice terms, hashes references locally, presents
  exact approval and funding steps, estimates the current step's Arc gas when
  configured, simulates ABI calls, and never requests unlimited allowance. A
  blank human reference receives a locally generated unique draft reference
  before hashing; no invoice document is uploaded.
- `/invoices` discovers creation events in bounded ranges, supports payer/payee
  and lifecycle filters, then refreshes each invoice from contract state.
- `/invoices/[id]` reads financial state, previews claims and cancellation, and
  fixes claim destinations to the immutable payee.
- `/activity` shows confirmed events only.
- `/proof/[id]` provides wallet-independent accounting reconciliation and
  clearly separates confirmed, calculated, illustrative, and unavailable data.
- `/docs` publishes the mechanism, risks, unsupported capabilities, and direct
  recovery path.

## Deployment gating

The application is in preview mode unless both values are present:

```text
NEXT_PUBLIC_DUELET_CONTRACT_ADDRESS
NEXT_PUBLIC_DUELET_DEPLOYMENT_BLOCK
```

The address is never guessed or replaced with a mock. Preview mode permits the
deterministic golden-fixture demonstration but disables every write. Once a
deployment is explicitly approved and verified, the application also checks
chain ID 5042, simulates the exact ABI request, requires a connected account,
estimates gas against the current account, requires enough native Arc USDC for
gas plus principal, and waits for a transaction receipt before describing an
action as confirmed. Start-now drafts refresh their timestamp every five
seconds so simulation does not silently reuse a stale schedule.

## Event reliability

Event history begins at the configured deployment block, queries public Arc RPC
logs in 9,999-block ranges, deduplicates by transaction hash and log index, and
orders equal-timestamp activity by block and log index. Strict ABI decoding
excludes malformed logs. RPC failure and incomplete discovery receive explicit
UI states; contract reads remain the financial source of truth.

## Phase 2 verification

- Seven Vitest financial and ABI integration assertions passed.
- The production Next.js build generated all eight route entries successfully.
- Ten Playwright scenarios passed across desktop Chrome and Pixel 7 viewports.
- Full-page screenshots of the landing, creation, and proof routes were
  inspected at desktop and mobile sizes; required content was visible and no
  horizontal overflow was detected.
- The unchanged Solidity kernel passed 43 Foundry test cases locally, including
  four stateful invariants across 8,192 handler calls.
- Both Arc mainnet fork cases passed separately under Arc Foundry with its
  required `--fork-url` execution mode. Fork funding was local-only.
- Formatting, linting, strict types, dependency audit, license inventory,
  secret scan, and diff hygiene passed.

## Accessibility and responsive behavior

The application uses semantic controls, keyboard focus indicators, readable
financial values, responsive list-to-card transformations, loading skeletons,
route error recovery, and reduced-motion handling. Browser checks cover the
required routes at desktop and mobile viewports and assert no horizontal page
overflow.

## Security posture

Amounts use `bigint`, six-decimal parsing, and the Solidity-compatible floor
formula. No invoice documents are uploaded. Free-text descriptions are hashed
locally and users are warned not to commit sensitive content. This application
does not make the unaudited contract audited or production-safe.
