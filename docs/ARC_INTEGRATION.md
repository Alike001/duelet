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
- [Arc Foundry](https://github.com/circlefin/arc-foundry)

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

The `contracts/foundry.toml` configuration pins:

- Solidity `0.8.37` with auto-detection disabled.
- Osaka EVM output.
- Optimizer enabled with 200 runs.
- Separate default and CI fuzz/invariant limits.
- `ARC_MAINNET_RPC_URL` as an environment-substituted read-only fork endpoint.
- OpenZeppelin resolved from the npm workspace, avoiding nested Git
  repositories.
- An `arc` profile selecting Arc execution semantics.

Arc uses execution-layer precompiles for native USDC transfer and blocklist
checks. Upstream Foundry can read the forked proxy but cannot execute those
precompiles. The integration suite therefore uses Circle's official Arc Foundry
`v0.8.0-2`, installed with its published SHA-256 verified, and
`FOUNDRY_PROFILE=arc`.

On October 14, 2026, that suite passed against the live mainnet RPC with the
real USDC proxy and implementation: local-only balance funding, approval,
`createAndFund`, partial withdrawal, cancellation/refund, final withdrawal, and
zero-liability reconciliation. Cheatcode funding changed only fork-local state;
it did not obtain or transfer mainnet funds.

Compiled optimized size:

- Runtime bytecode: `6,216` bytes.
- Initcode: `6,603` bytes.
- EIP-170 runtime margin: `18,360` bytes.

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

Assumption: the friend has at most `1.000000 USDC` total, including the first
funding transaction's gas. Phase 1 used compiled bytecode, a live Arc deployment
estimate, and Arc Foundry call traces. The live gas-price response was
`20,000,001,337` wei per gas. The budget uses a `30 gwei` fee ceiling plus a 25%
gas-unit contingency; it is not a prediction of the final wallet quote.

| Action                            | Basis gas |    Budget gas |
| --------------------------------- | --------: | ------------: |
| Friend-to-payer native funding    |    21,000 |        30,000 |
| `DueletStream` deployment         | 1,436,821 |     1,436,821 |
| Exact `10,000`-unit USDC approval |    56,229 |        56,229 |
| `createAndFund`                   |   194,816 |       220,000 |
| Partial `withdraw`                |    78,049 |       100,000 |
| `cancel` and refund               |    74,517 |        96,000 |
| Final `withdraw`                  |    28,801 |        50,000 |
| **Lifecycle subtotal**            |           | **1,989,050** |
| 25% gas-unit contingency          |           |       497,263 |
| **Conservative gas ceiling**      |           | **2,486,313** |

At `30 gwei`, the conservative ceiling costs `0.074589390 USDC`. The all-in
funding ledger is therefore:

| Item                        | Maximum allocation (USDC) |
| --------------------------- | ------------------------: |
| Conservative cumulative gas |                  0.074590 |
| Stream principal            |                  0.010000 |
| Explorer verification       |                  0.000000 |
| Uncommitted reserve         |                  0.915410 |
| **Absolute total**          |              **1.000000** |

If the initial sender pays its fee from the same 1 USDC balance, the amount sent
to the payer must be reduced by that confirmed fee. The canary remains within
the preferred 0.8 USDC gas ceiling by a wide margin.

This is an authorization ceiling, not a spending target. Before deployment:

- Repeat deployment and wallet-specific transaction simulations at a pinned
  current block.
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
