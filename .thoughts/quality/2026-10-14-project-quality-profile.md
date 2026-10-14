# Project Quality Profile: Duelet

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

`npm run check` composes the complete local gate. The real-USDC fork suite must
also pass under the pinned Arc Foundry release and `FOUNDRY_PROFILE=arc`.

## Required CI gates

GitHub Actions uses the pinned Node major and Circle Arc Foundry release,
verifies the tool archive checksum, installs from the lockfile, runs
`npm run check`, and exercises the public-RPC fork suite. CI never receives a
deployment private key.

## Suggested local hooks

No hook manager is installed. Before committing, run `npm run check`.
CI is authoritative; a future lightweight pre-commit hook may run formatting,
secret scanning, and `git diff --check` without bypassing CI.

## File-size policy

- Target: 200 source lines.
- Warning: above 200 source lines.
- Hard cap: above 300 source lines without a written reason.
- Excluded: generated files, lockfiles, build output, fixtures, vendored code,
  and long-form research/specification documents.

The 311-line unit-test file is an accepted Phase 1 exception: it is test code,
contains 21 small named cases plus event declarations, and has no production
logic. The production contract remains below 300 lines.

## Commit policy

Use Conventional Commits. The Phase 0 commit is
`chore: establish Arc invoice streaming workspace`.

## Security gates

- Unit, fuzz, stateful invariant, reentrancy, permission, failure-token, and Arc
  fork tests.
- Contract-size and gas reports from real compiled artifacts.
- Static analysis and independent review remain deployment-readiness gates.
- No mainnet scripts may broadcast by default.

## Open questions

- The final deployment tool and explorer verification path require a dry run.
- Wallet-specific gas simulation must be repeated immediately before approval.
- A professional security audit has not occurred.
