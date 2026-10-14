# Arc DeFi Reverse-Engineering — Research Handoff

**Status:** Research complete; recommendation is CONDITIONAL GO. No architecture approval or implementation permission has been granted.

## Provenance

- `REVERSE_ENGINEERING_REPORT.md` is the complete Codex review supplied by the user on October 13, 2026.
- Original older project: `~/Desktop/arc/arc-obligation-protocol` (keep unchanged). The Codex report states that the older repository was clean at `b845dfa` during research, but verify its status locally before proceeding.
- This is a **new project**, not a rebrand or extension of the prior obligation contracts.

## Objective

Reconstruct _real working financial mechanisms_ from six reference projects—Zona, Peridot, Aqua0, Lockgate, AutoRange, Atoma—using verified Arc infrastructure. Do not invent a generic AI-themed product or cram all six into one platform.

## Current best-supported direction

Zona/Peridot-style lending and borrowing mechanics implemented through existing, verified Morpho Blue markets and Morpho Vault V2 on Arc. This direction is CONDITIONAL, not final. Before design lock, verify which market/vault lifecycles can actually be safely completed on an Arc fork, and what value the product offers beyond the Morpho UI or official Circle kits.

## Important gaps to close before coding

1. Compare existing Morpho official UI, Circle Borrow/Earn Kit and current market explorers to our proposed customer experience. Explain where a genuine product would be better, rather than a repackaged dashboard.
2. Confirm selected Arc markets/vaults with direct contract reads, market IDs, exact addresses, oracle state, asset decimals, borrowable cash and **actually withdrawable** liquidity.
3. Prove a deposit -> redeem and supply collateral -> borrow -> repay -> withdraw lifecycle in local fork tests, with rollback/failure-path checks. Label everything FORK ONLY until actually broadcast.
4. Review allowance, wallet support, bundle/SDK ABI compatibility and complete user exits if our frontend stops working.
5. Draft strong UX & landing-page architecture grounded in Zona/Peridot/AutoRange, with a real visible position preview and honest financial metrics.
6. Resolve local disk-quota issue _without deleting files from the previous project_, and do not install/scaffold anything until it is resolved.

## Project safety

- Do not modify, delete or move the old repo without explicit permission.
- No mainnet signing, transactions or gas spending without explicit user approval.
- Do not invent tokens, markets, APY, TVL, yields or mainnet positions.
- Research output is not independent contract audit or deployment evidence.

Read `CODEX_FIRST_PROMPT.md` for the first task in the new workspace.
