# Arc Microgrants submission draft

## Duelet — Invoice once. Pay over time.

Duelet is an Arc-native, invoice-linked USDC streaming escrow. A payer funds an
invoice in full, the payee earns that deposit linearly over time, and anyone can
trigger a claim that always pays the immutable payee. If the payer cancels
before maturity, unused escrow returns immediately while vested funds remain
claimable.

Duelet's non-upgradeable Solidity contract independently owns invoice identity,
escrow custody, vesting, withdrawals, cancellation refunds and aggregate
liability accounting. It has no owner, fees, governance token, proxy or admin
withdrawal path.

Arc is central to the product: USDC is both the settlement asset and native gas
asset, producing a dollar-denominated payment lifecycle with sub-second finality
while Duelet preserves the ERC-20 interface's six-decimal accounting.

The application provides invoice creation, payer/payee views, live entitlement,
cancellation previews, confirmed activity and a shareable proof page that
reconciles deposit = withdrawn + refunded + remaining liability.

Status: implementation and release-hardening complete; unaudited and not yet
deployed. Mainnet link, repository URL, contract address and transaction proof
will be added only after the minimal 0.010000 USDC canary is confirmed.

## Submission placeholders

- Live application: **PENDING**
- Public repository: **PENDING**
- Builder profile: **PENDING**
- Contract address: **PENDING**
- Mainnet proof invoice: **PENDING**
