# Duelet Arc mainnet preflight

Status: **read-only preflight; deployment is not authorized**.

Observed on 2026-10-14 through `https://rpc.mainnet.arc.io`:

| Check                    | Result                                       |
| ------------------------ | -------------------------------------------- |
| Chain ID                 | `5042`                                       |
| Observed block           | approximately `25978027`                     |
| Base fee                 | `20,000,000,000` wei/gas                     |
| Suggested priority fee   | `1,153` wei/gas                              |
| `eth_gasPrice`           | `20,000,001,153` wei/gas                     |
| Arc USDC                 | `0x3600000000000000000000000000000000000000` |
| ERC-20 symbol / decimals | `USDC` / `6`                                 |
| Arc USDC code present    | yes                                          |

## Frozen deployment payload

- Contract: `src/DueletStream.sol:DueletStream`
- Compiler: Solidity `0.8.37`
- EVM: Osaka
- Optimizer: enabled, 200 runs
- Constructor value: official Arc USDC above
- Constructor ABI encoding:
  `0x0000000000000000000000003600000000000000000000000000000000000000`
- Creation bytecode: 6,603 bytes
- Deployment input: 6,635 bytes
- Expected runtime: 6,216 bytes
- Deployment-input keccak256:
  `0xb367394f497b3c3b939cde50b967e81e190a5ea8a96c5af07233adde4c87eba8`
- Expected runtime keccak256:
  `0xf4ad4b494fd7d609868ae5737d5840ee903b001767718cba4f249309ff84606f`
- Fresh wallet-independent `eth_estimateGas`: `1,436,821` gas

The exact payloads and source input are in `artifacts/blockscout/`. No private
key, signature, or broadcast is involved in generating or estimating them.

## Wallet-specific gates still pending

The deployer's public address is not stored in the repository or exposed to
the release process. Therefore these values cannot honestly be asserted yet:

- native Arc gas balance and ERC-20 USDC balance;
- pending nonce and expected CREATE contract address;
- sender-specific deployment estimate and access-control simulation;
- the distinct public payee address; and
- transaction-by-transaction nonce schedule.

Immediately before any approval request, read those values from the connected
wallet, compute the CREATE address from deployer plus nonce, rerun
`eth_estimateGas` from that address, and reconcile the 1.000000 USDC ceiling in
`MAINNET_BUDGET.md`. Stop if the wallet does not cover every conservative gas
limit, the 0.010000 principal, and reserve.

## Proposed transaction ceiling

At a conservative maximum fee of 25 gwei, six payer-paid transactions have a
combined 2,150,000 gas-unit ceiling and 0.053750 USDC worst-case gas cost. With
0.010000 USDC escrow principal, 0.936250 USDC remains uncommitted. This ceiling
must be refreshed from live fee data before every signature; it is not an
authorization to transact.
