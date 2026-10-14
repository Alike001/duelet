# Arc integration

Verified: October 14, 2026

## Network configuration

| Property              | Value                                        |
| --------------------- | -------------------------------------------- |
| Network               | Arc mainnet                                  |
| Chain ID              | `5042`                                       |
| HTTP RPC              | `https://rpc.mainnet.arc.io`                 |
| Explorer              | `https://explorer.arc.io`                    |
| Native gas symbol     | USDC                                         |
| EVM baseline          | Osaka                                        |
| USDC ERC-20 interface | `0x3600000000000000000000000000000000000000` |
| USDC ERC-20 decimals  | `6`                                          |
| Native gas decimals   | `18`                                         |

Official Arc documentation confirms the chain ID, RPC, USDC address, dual
decimal model, and 20 Gwei minimum fee behavior:

- [RPC endpoints](https://docs.arc.io/arc/references/rpc-endpoints.md)
- [Contract addresses](https://docs.arc.io/arc/references/contract-addresses.md)
- [EVM differences](https://docs.arc.io/arc/references/evm-differences.md)

A read-only RPC check during Phase 0 returned chain ID `5042`; calling
`decimals()` and `symbol()` at the configured address returned `6` and `USDC`.
No transaction was signed or broadcast.

## USDC accounting model

Arc's native and ERC-20 USDC interfaces expose one underlying balance through
different precisions. Contract invoice amounts use the ERC-20 interface and six
decimals. Transaction gas uses native 18-decimal units.

```text
contract amount: 0.010000 USDC = 10,000 ERC-20 base units
gas fee: gasUsed * effectiveGasPrice / 10^18 USDC
```

Never pass ERC-20 base units as native transaction value or interpret wei-like
gas quantities as six-decimal invoice amounts.

Arc documents a minimum `maxFeePerGas` of 20 Gwei. Gas estimation must be
performed again immediately before any proposed mainnet signature. The UI must
show the fee in USDC and reject a transaction that would exceed the remaining
approved cumulative budget.

## Timestamp model

Arc produces sub-second blocks, while the EVM exposes whole-second
`block.timestamp` values. Timestamps are non-decreasing rather than strictly
increasing, so multiple blocks may share one timestamp. Vesting uses timestamp
seconds and must not use block numbers as elapsed time.

Tests must explicitly place two blocks at the same timestamp and prove:

- Vested amount is unchanged.
- A second withdrawal has zero new claimable amount.
- Transaction ordering remains independently identifiable by block and log
  position even when vesting time is equal.

## Foundry configuration

The `contracts/foundry.toml` foundation pins:

- Solidity `0.8.37` with auto-detection disabled.
- Osaka EVM output.
- Optimizer enabled with 200 runs.
- Separate default and CI fuzz/invariant limits.
- `ARC_MAINNET_RPC_URL` as an environment-substituted read-only fork endpoint.
- OpenZeppelin resolved from the npm workspace, avoiding nested Git
  repositories.

Phase 0 contains no Solidity production source. Phase 1 must confirm compiled
bytecode size, gas estimates, and compatibility against an Arc fork before any
deployment proposal.

## Minimum canary lifecycle

No canary is authorized yet. After explicit approval, the smallest meaningful
mainnet proof is:

1. Fund the payer wallet within the approved all-in budget.
2. Deploy the verified non-upgradeable contract.
3. Approve exactly `10,000` ERC-20 base units.
4. Create and fund a 180-second, 0.010000 USDC invoice between distinct payer
   and payee addresses.
5. Trigger one observable partial-time withdrawal to the payee.
6. Cancel before maturity and verify the exact unvested payer refund.
7. From the gas-funded payer wallet, permissionlessly trigger the payee's final
   frozen claim.
8. Verify receipt status, emitted events, wallet deltas, zero invoice liability,
   and aggregate solvency on the explorer.

Mainnet timing will not be expected to land at the golden fixture's exact
60-second point. Expected values will be computed from the confirmed block
timestamps.

## One-USDC all-in budget

Assumption: the friend has at most `1.000000 USDC` total available, including
the funding transfer's gas. The friend should therefore retain up to `0.010000`
for that transfer and send approximately `0.990000 USDC` to the payer wallet.
Actual values must be recomputed from a live simulation.

| Item                                    | Maximum allocation (USDC) | Notes                                                                |
| --------------------------------------- | ------------------------: | -------------------------------------------------------------------- |
| Friend-to-payer funding transaction gas |                  0.010000 | Paid by sender; included in all-in cap                               |
| Contract deployment                     |                  0.200000 | Above the 0.160862 compiled Sablier benchmark cost at 20 Gwei        |
| Exact USDC approval                     |                  0.020000 | One payer transaction                                                |
| Invoice creation and funding            |                  0.080000 | One payer transaction                                                |
| Partial withdrawal trigger              |                  0.050000 | Payer can trigger; funds go to payee                                 |
| Cancellation and refund                 |                  0.060000 | One payer transaction                                                |
| Final withdrawal trigger                |                  0.050000 | Payer can trigger; payee needs no gas                                |
| Explorer contract verification          |                  0.000000 | Expected offchain; paid verification is prohibited                   |
| User-wallet gas contingency             |                  0.320000 | Covers estimate variance and replacement, never intentional failures |
| Stream principal                        |                  0.010000 | Temporarily escrowed; distributed/refunded by lifecycle              |
| Uncommitted safety reserve              |                  0.200000 | Must remain unspent                                                  |
| **Total**                               |              **1.000000** | Absolute combined envelope                                           |

The payer wallet's post-funding envelope is `0.990000 USDC`: at most `0.780000`
for its own gas, `0.010000` principal, and `0.200000` uncommitted reserve.
Planned user gas is below the preferred 0.8 USDC ceiling.

This is an authorization ceiling, not a spending target. Before deployment:

- Replace allocations with exact compiled and simulated estimates.
- Include the live `maxFeePerGas`, not merely the base fee.
- Stop if cumulative worst-case gas plus principal exceeds available balance.
- Do not count refunded principal as gas funding before it is confirmed.
- Do not perform paid verification or a replacement transaction without a
  revised ledger and explicit approval.

If the friend cannot fund the transfer fee in addition to the amount sent, the
amount received must be reduced; the product must not assume a hidden second
source of gas.

## Deployment gates

- Phase 1 contract and financial tests complete.
- Arc fork suite passes against a pinned recent block.
- Exact bytecode and deployment gas recorded from compiled artifacts.
- Cumulative canary simulations remain inside the ledger.
- Contract source and constructor arguments ready for public verification.
- User explicitly approves each deployment or fund-moving action.
