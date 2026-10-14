# Duelet release security review

Review date: October 14, 2026

Scope: `DueletStream.sol`, tests, mocks, the financial model, Arc fork behavior,
web transaction boundaries, event discovery and release configuration. This is
an independent engineering review, not a professional security audit.

## Verdict

No critical or high-severity issue was found. A minimal-value canary is
reasonable only after every deployment blocker is completed. Material funds
require an independent audit.

## Findings

### Critical

None identified.

### High

None identified.

### Medium

**M-01 — issuer controls can indefinitely deny transfers.** Arc USDC enforces
pause/blocklist controls. If the contract or payee is restricted, withdrawal
fails atomically; if the payer is restricted, a cancellation refund may fail.
Accounting remains intact, but funds can stay locked until the issuer condition
changes. V1 cannot safely bypass this. Tests and UI disclosures cover it.

**M-02 — no audited security assurance.** Unit, fuzz, invariant, adversarial and
fork coverage reduce risk but do not replace an audit. The canary principal is
therefore capped at 0.010000 USDC and material deposits are inappropriate.

### Low

**L-01 — direct token surplus is permanently trapped.** Unsolicited USDC does
not create invoice liability and cannot be swept. This deliberately removes an
admin-drain surface. `surplusBalance` makes the condition visible.

**L-02 — metadata hashes can leak guessable content.** Hashing a short invoice
description is not encryption. Phase 3 explicitly warns against names,
addresses, documents and confidential terms. No document is uploaded.

**L-03 — public RPC discovery may be incomplete.** Bounded log queries can be
rate-limited. The UI labels incomplete history and uses contract reads as the
financial authority.

### Informational

**I-01 — cancellation is intentionally unilateral.** Before maturity the payer
may stop future vesting without payee approval; already earned funds remain.

**I-02 — timestamps can repeat across Arc blocks.** Vesting does not advance
until the second changes. Tests prove a same-timestamp second claim pays zero.

**I-03 — unsupported assets are unrecoverable.** Only immutable Arc USDC is
accounted; there is no rescue function.

## Contract review conclusions

- Funding records state before interaction under `nonReentrant`; any failed or
  short transfer rolls back existence and aggregate liability.
- Payout/refund effects precede token calls. Reverts restore every update.
- Exact contract-debit and recipient-credit checks reject fee, no-op and
  malformed transfer behavior.
- `Math.mulDiv` prevents intermediate overflow and rounds down; maturity vests
  the final remainder.
- `withdraw` accepts neither amount nor destination and always pays the payee.
- Cancellation is payer-only, single-use and forbidden at/after maturity.
- IDs bind protocol domain, chain, contract, payer and reference.
- Concurrent invoices preserve exact per-invoice and aggregate accounting.
- No owner, delegate, upgrade, fee, arbitrary call or sweep authority exists.

## Phase 3 fixes

1. Deployed writes now require live code hash
   `0xf4ad4b494fd7d609868ae5737d5840ee903b001767718cba4f249309ff84606f`
   and `USDC()` equal to official Arc USDC. Regression tests cover mismatches.
2. The Arc fork is pinned to block `25947829` and asserts proxy implementation
   code, token metadata, immutable configuration and runtime code hash.
3. Large USDC formatting no longer converts integer values through JavaScript
   `Number`; a regression vector protects exact display.
4. Metadata copy now explains that public hashes are guessable.
5. A chain-guarded deployment script was added without credentials.
6. Funding is unlocked only when allowance equals the invoice amount exactly;
   a larger stale allowance is surfaced and must be replaced. Unit coverage
   protects under-, exact- and over-allowance states.
7. Event discovery excludes the newest 20 blocks to avoid presenting
   potentially reorganized logs as final. Queries remain range-bounded and
   strict-decoded; RPC failure produces an unavailable state, not partial data.
8. The Arc fork command now forces an Arc Foundry rebuild. This prevents an
   upstream Foundry artifact in the shared cache from changing the deployed
   runtime hash while the test incorrectly reports “compilation skipped.”

No financial-contract behavior changed.

## Tool availability

`forge lint --deny warnings`, compiler checks, dependency audit, secret scan and
manual line-by-line review ran. Slither, Semgrep, Aderyn and Solhint were not
installed, were not installed during Phase 3, and are not represented as passed.
