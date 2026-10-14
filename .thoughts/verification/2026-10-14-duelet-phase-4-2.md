# Duelet Phase 4.2 verification audit

Date: 2026-10-14

## Verification scope

Verify the Phase 4.1 redesign against the approved release requirements, merge
only after CI passes, publish the frontend in explicit preview mode, validate
the public site, prepare reproducible source-verification evidence, and perform
a read-only Arc mainnet preflight. Contract deployment, signing, approvals,
transfers, and wallet-secret access are excluded.

## Release identity

- Pull request: <https://github.com/Alike001/duelet/pull/1>
- Verified PR head: `002fd810d0b2b210e09ef4abb0029e39c8c9860a`
- Squash merge: `cb6b9b09c78da79fd64bfce0888af101179b5ee4`
- Main CI: <https://github.com/Alike001/duelet/actions/runs/38632043379>
- Vercel deployment: `dpl_7jpDFx9Qx2yvNxQLKJn8FLsz7QYX`
- Public alias: <https://duelet.vercel.app>

## Evidence summary

- PR CI and GitGuardian passed before merge; main-branch CI passed again on the
  exact merge commit.
- Local validation passed: formatting, lint, strict TypeScript, production
  build, secret scan, dependency audit, 11 web tests, one shared-domain test,
  43 Foundry tests, two pinned Arc real-USDC fork tests, and 28 Playwright tests.
- The same 28 Playwright checks passed against the public Vercel deployment on
  desktop Chrome and Pixel 7 profiles.
- All documented public routes returned successfully; invalid dynamic IDs
  rendered controlled application error states. No blocking browser console or
  page errors were observed while visiting the primary routes.
- Vercel has no contract/deployment environment variables. The live banner
  explicitly says preview mode and all financial writes remain disabled.
- `DueletStream.sol`, its ABI, formulas, and authorization behavior were not
  changed in this phase.
- The exact Standard JSON, constructor encoding, creation/deployment bytecode,
  constructor-patched runtime, and hashes are prepared under
  `artifacts/blockscout/`.

## Arc preflight evidence

- Chain ID: `5042`
- Official Arc USDC: `0x3600000000000000000000000000000000000000`
- ERC-20 token interface: symbol `USDC`, six decimals, contract code present
- Observed base fee: 20 gwei
- Observed `eth_gasPrice`: approximately 20.000001153 gwei
- Fresh wallet-independent deployment estimate: 1,436,821 gas
- Conservative cumulative gas limit: 2,150,000 gas at 25 gwei
- Worst-case gas ceiling: 0.053750 native USDC
- Demonstration principal: 0.010000 ERC-20 USDC
- Uncommitted amount inside the reported 1.000000 total: 0.936250 USDC

## Finality decision

Official Arc documentation states committed blocks are immediately
irreversible and explicitly instructs event indexers to remove confirmation
depth delays. The former 20-block delay was removed with a regression test.
The 9,999-block log range and query retry/refetch behavior remain for public
RPC constraints; availability handling is not represented as finality.

## Visual inspection

Fresh live desktop and mobile screenshots were captured and visually inspected
for the homepage, workspace, create flow, and proof view. Compared with the old
release, the live design has a stronger editorial hierarchy, a dominant and
legible stream model, clearer preview disclosure, role-focused empty states,
and better transaction/reconciliation presentation. No overflow or clipped
financial value was found. Remaining polish is non-blocking: full-page mobile
screens are necessarily long, and a real event history cannot be judged until
a verified deployment exists.

## Gaps and blockers

- The public deployer address was not provided to the release process, so
  native/ERC-20 balances, nonce, CREATE address, and sender-specific gas
  simulation remain pending.
- Actual MetaMask testing is pending. MetaMask is installed in an active local
  Chrome profile, but that profile is not exposed through a safe automation
  channel; it was not copied, unlocked, or manipulated.
- Blockscout's public UI is reachable, while API documentation probes are
  Cloudflare-blocked from this environment. Actual source verification requires
  a deployed address and remains pending by definition.
- Mainnet write mode must not be enabled until deployment receipt, runtime hash,
  immutable USDC, deployment block, and explorer evidence are independently
  verified.

## Verdict

Frontend public release: **GO**.

Arc mainnet deployment: **NO-GO pending wallet-specific preflight and explicit
deployment authorization**. No funds were spent and no transaction was signed
or broadcast during this audit.
