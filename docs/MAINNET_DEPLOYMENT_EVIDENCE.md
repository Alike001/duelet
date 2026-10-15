# Duelet Arc mainnet deployment evidence

Verified independently through `https://rpc.mainnet.arc.io` at
`2026-10-15T00:34:18Z`.

| Property                       | Confirmed value                                                                                      |
| ------------------------------ | ---------------------------------------------------------------------------------------------------- |
| Chain ID                       | `5042`                                                                                               |
| Contract                       | `0x90d3e5aee13d444ec0679bdd3663dee823a3959f`                                                         |
| Transaction                    | `0x876c3cb48dba9d4a5543d3f434ac359518554591bbe8df986d72f8be77b86333`                                 |
| Receipt status                 | `1` (success)                                                                                        |
| Block                          | `26007220`                                                                                           |
| Sender                         | `0xdE67A35B322e5A31e8215B5245CA4e48d7977F71`                                                         |
| Nonce                          | `0`                                                                                                  |
| Transaction type               | `2` (EIP-1559)                                                                                       |
| Gas used                       | `1,424,349`                                                                                          |
| Effective gas price            | `20,000,000,001 wei`                                                                                 |
| Deployment-input keccak256     | `0xb367394f497b3c3b939cde50b967e81e190a5ea8a96c5af07233adde4c87eba8`                                 |
| Runtime length                 | `6,216 bytes`                                                                                        |
| Runtime keccak256              | `0xf4ad4b494fd7d609868ae5737d5840ee903b001767718cba4f249309ff84606f`                                 |
| `USDC()`                       | `0x3600000000000000000000000000000000000000`                                                         |
| `ARC_MAINNET_CHAIN_ID()`       | `5042`                                                                                               |
| `ARC_MAINNET_USDC()`           | `0x3600000000000000000000000000000000000000`                                                         |
| `INVOICE_ID_DOMAIN()`          | `0xd8cc373b2cc55028e2e1e6bd833ce45e1ee57b63f64afc78d5a6a367382a436c`                                 |
| `totalOutstandingLiability()`  | `0`                                                                                                  |
| `isSolvent()`                  | `true`                                                                                               |
| Payer balance after deployment | `0.971513019998575651 USDC` native view / `0.971513 USDC` ERC-20 view (shared backing; counted once) |

The deployment input matches `artifacts/blockscout/deployment-input.hex`. The
runtime matches `artifacts/blockscout/expected-runtime-bytecode.hex`. The subsequent funding and full-claim lifecycle is recorded in
[MAINNET_LIFECYCLE_EVIDENCE.md](MAINNET_LIFECYCLE_EVIDENCE.md).

## Source-verification status

Verified through official Sourcify on `2026-10-15T00:50:30Z` using the exact
prepared Standard JSON, compiler `0.8.37+commit.f401782d`, Osaka EVM target,
and optimizer 200. Sourcify reports exact creation and runtime matches under
verification job `91deece6-a159-4cf7-a936-02664471003d` and match ID
`56131569`:

- <https://sourcify.dev/server/v2/contract/5042/0x90d3e5aee13d444ec0679bdd3663dee823a3959f>

Arc Blockscout imported the verified source through its Bytecode Database and
reports an exact match with the same compiler, settings, EVM target, source,
and constructor argument:

- <https://explorer.arc.io/address/0x90d3e5aee13d444ec0679bdd3663dee823a3959f?tab=contract>
