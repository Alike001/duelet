# Project Quality Profile: ArcInvoiceStream

## Detected stack

- npm workspaces on Node 24.
- Next.js App Router, React, strict TypeScript, and Tailwind CSS.
- Foundry and Solidity targeting Arc's Osaka EVM baseline.
- Pure TypeScript domain package and shared JSON financial fixtures.

## Required local checks

- `npm run format:check`
- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm test`
- `npm run secret:scan`
- `git diff --check`

`npm run check` composes the complete gate. Phase 0 Foundry tests correctly
report zero tests because production Solidity is intentionally absent.

## Required CI gates

GitHub Actions uses the pinned Node major and Foundry release, installs from the
lockfile, and runs the same `npm run check` command. CI never receives a
deployment private key.

## Suggested local hooks

No hook manager is installed in Phase 0. Before committing, run `npm run check`.
CI is authoritative; a future lightweight pre-commit hook may run formatting,
secret scanning, and `git diff --check` without bypassing CI.

## File-size policy

- Target: 200 source lines.
- Warning: above 200 source lines.
- Hard cap: above 300 source lines without a written reason.
- Excluded: generated files, lockfiles, build output, fixtures, vendored code,
  and long-form research/specification documents.

## Commit policy

Use Conventional Commits. The Phase 0 commit is
`chore: establish Arc invoice streaming workspace`.

## Security gates for Phase 1

- Unit, fuzz, stateful invariant, reentrancy, permission, failure-token, and Arc
  fork tests.
- Contract-size and gas reports from real compiled artifacts.
- Static analysis and independent review before deployment approval.
- No mainnet scripts may broadcast by default.

## Open questions

- Exact compiled gas remains unknown until Phase 1 source exists.
- The final deployment tool and explorer verification path require a dry run.
- Static-analysis tooling should be selected only after the contract exists.
