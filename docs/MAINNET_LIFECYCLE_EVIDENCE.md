# Confirmed mainnet payment evidence

Read-only verification at 2026-10-15T01:53:32.730Z, Arc chain 5042, block 26017453.
Raw decoded events, receipt status, contract state and code hash: [lifecycle.json](../artifacts/mainnet/lifecycle.json).

Contract: [0x90d3e5aee13d444ec0679bdd3663dee823a3959f](https://explorer.arc.io/address/0x90d3e5aee13d444ec0679bdd3663dee823a3959f?tab=contract).
Runtime hash matches the approved release: `0xf4ad4b494fd7d609868ae5737d5840ee903b001767718cba4f249309ff84606f`.
The immutable USDC address is `0x3600000000000000000000000000000000000000`.

## Demonstrated behavior

A real 0.01 USDC invoice was funded and fully claimed after maturity. The
payer triggered the claim; the contract paid the stored recipient. This is
technical demonstration evidence, not evidence of customer adoption or revenue.

| Event          | Block    | Transaction                                                                                                  | Receipt |
| -------------- | -------- | ------------------------------------------------------------------------------------------------------------ | ------- |
| InvoiceCreated | 26012329 | [0xc8eda3ec…](https://explorer.arc.io/tx/0xc8eda3ec664830e7eb1a0ca5702b266cc8df1eaf2ed1d3cbd1d495cab065acc6) | success |
| FundsWithdrawn | 26016453 | [0x593c0b32…](https://explorer.arc.io/tx/0x593c0b32116699c69d7ed46ca80a49684dfe0be0639c6f903c6c64480e1512c1) | success |

Public receipt: [0x5d98e7345f25df8b961e06c9631ab7287633132a1fb28e3611ea05e47ae406f6](https://duelet.vercel.app/proof/0x5d98e7345f25df8b961e06c9631ab7287633132a1fb28e3611ea05e47ae406f6).

- Funded: **0.010000 USDC**.
- Withdrawn: **0.010000 USDC**.
- Refunded: **0 USDC**.
- Remaining invoice liability: **0 USDC**.
- Aggregate outstanding liability: **0 USDC** at the verification block.
- `isSolvent()`: **true** at the verification block.
- Funding plus claim gas: **0.0070389925 USDC**. This excludes approval and contract deployment.

Reconciliation: `0.010000 = 0.010000 + 0 + 0`.

## Evidence boundaries

No partial-time withdrawal or cancellation event was present in the scanned
contract history through block 26017453. Do not describe this invoice as
proof of a cancellation/refund lifecycle. Cancellation is covered by repository
tests and the explicitly illustrative UI. A separate real cancellation example
requires a new funded invoice and the payer's wallet signatures.

This verification made no transactions and used no private keys. It establishes
observed state at a particular block, not a professional security audit.

To refresh the read-only report with Node.js 24:

```sh
node scripts/verify-mainnet-evidence.mjs
```

The script checks the chain, runtime hash, immutable USDC address, and each
invoice accounting identity before printing JSON. Its output is current at
the reported block; it does not rewrite the historical evidence file.
