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

A read-only RPC check during Phase 3 returned chain ID `5042`; calling
`decimals()` and `symbol()` at the configured address returned `6` and `USDC`.
The release fork is pinned to block `25947829`. At that block the USDC proxy
code hash was
`0xc9987bd3af6b26a030951faa7eacc017b68343aeedf3ce5fe68f821c4b93939d`,
its implementation was `0xC6AD664ac6679F4Ce74e10E91449C93Ec1ae3cA6`, and that
implementation's code hash was
`0x237a5899a4c4e1c8b60fe7626371778ce8ef0a554350cd92cdf8ae393f59966f`.
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
`FOUNDRY_PROFILE=arc`. The Arc execution mode must be selected with the
`--fork-url` command-line flag. Supplying the RPC only to a Solidity
`vm.createSelectFork` call is insufficient: the generic EVM runner then reaches
Arc's blocklist precompile as an unsupported opcode. The reproducible command is:

```bash
ARC_MAINNET_RPC_URL=https://rpc.mainnet.arc.io \
  ARC_MAINNET_FORK_BLOCK=25947829 \
  npm run test:arc-fork --workspace @duelet/contracts
```

The fork package script forces an Arc Foundry rebuild before execution.
Upstream and Arc Foundry artifacts must not share an assumed runtime hash:
running upstream `forge build` can replace the cache with different metadata
and execution-target bytecode. Release deployment, hash derivation and fork
assertions all use the forced Arc build.

On October 14, 2026, that pinned suite passed against the live mainnet RPC with the
real USDC proxy and implementation: local-only balance funding, approval,
`createAndFund`, partial withdrawal, cancellation/refund, final withdrawal, and
zero-liability reconciliation. Cheatcode funding changed only fork-local state;
it did not obtain or transfer mainnet funds.

Compiled optimized size:

- Runtime bytecode: `6,216` bytes.
- Initcode: `6,603` bytes.
- EIP-170 runtime margin: `18,360` bytes.
- Arc-configured runtime code hash:
  `0xf4ad4b494fd7d609868ae5737d5840ee903b001767718cba4f249309ff84606f`.

## Minimum canary lifecycle

No canary is authorized yet. After explicit approval, the smallest meaningful
mainnet proof is:

1. Fund the payer wallet within the approved all-in budget.
2. Deploy the verified non-upgradeable contract.
3. Approve exactly `10,000` ERC-20 base units.
4. Create and fund a 300-second, 0.010000 USDC invoice between distinct payer
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

The authoritative transaction-by-transaction ledger is
[`MAINNET_BUDGET.md`](./MAINNET_BUDGET.md). It currently reserves 2,180,000 gas
at a 25 gwei maximum fee, or 0.054500 USDC, plus the 0.010000 USDC principal.
Wallet addresses, nonces, balances, live fee reads and post-deployment
simulations remain mandatory before any signature.

## Deployment gates

- Phase 1 contract and financial tests complete.
- Arc fork suite passes against a pinned recent block.
- Exact bytecode and deployment gas recorded from compiled artifacts.
- Cumulative canary simulations remain inside the ledger.
- Contract source and constructor arguments ready for public verification.
- User explicitly approves each deployment or fund-moving action.
