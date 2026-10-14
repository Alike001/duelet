# Duelet mainnet canary budget

Status: planned only; no transaction is authorized or broadcast.

Total reported wallet funding: **1.000000 USDC**, including gas and the
0.010000 USDC principal. The public deployer address has not been supplied to
the release tooling, so its balance and nonce remain independently unverified.

Fresh read-only observation on October 14, 2026 near block `25978027`:

- `eth_gasPrice`: 20,000,001,153 wei/gas (about 20.000001153 gwei)
- `eth_maxPriorityFeePerGas`: 1,153 wei
- latest base fee: 20,000,000,000 wei/gas

The ceiling uses **25 gwei**, 25% above observation. Refresh every value before
signing; this is a maximum planning parameter, not a price prediction.

| Transaction           | Expected nonce |  Estimate |     Gas limit | Max fee |        Worst case |
| --------------------- | -------------- | --------: | ------------: | ------: | ----------------: |
| Deploy Duelet         | payer `N`      | 1,436,821 |     1,600,000 | 25 gwei |     0.040000 USDC |
| Approve 0.010000      | payer `N+1`    |    56,229 |        70,000 | 25 gwei |     0.001750 USDC |
| Create and fund       | payer `N+2`    |   194,816 |       240,000 | 25 gwei |     0.006000 USDC |
| Partial withdrawal    | payer `N+3`    |    78,049 |       100,000 | 25 gwei |     0.002500 USDC |
| Cancel/refund         | payer `N+4`    |    74,517 |        95,000 | 25 gwei |     0.002375 USDC |
| Final withdrawal      | payer `N+5`    |    28,801 |        45,000 | 25 gwei |     0.001125 USDC |
| **Total gas ceiling** |                |           | **2,150,000** |         | **0.053750 USDC** |

| Allocation                 |         USDC |
| -------------------------- | -----------: |
| Worst-case cumulative gas  |     0.053750 |
| Stream principal           |     0.010000 |
| Uncommitted safety reserve |     0.936250 |
| **Total**                  | **1.000000** |

| Balance checkpoint              | Minimum payer balance |
| ------------------------------- | --------------------: |
| Starting balance (must verify)  |              1.000000 |
| Deployment                      |              0.960000 |
| Approval                        |              0.958250 |
| Funding plus locked principal   |              0.942250 |
| Partial withdrawal gas          |              0.939750 |
| Cancellation gas, before refund |              0.937375 |
| Final claim gas, before refund  |              0.936250 |

The payer later receives the confirmed unvested refund; the payee receives
vested claims. Across payer, payee and escrow, remaining value equals one USDC
minus actual gas.

## Pending wallet-specific evidence

- Public payer/payee addresses and starting nonces.
- Confirmed payer native-gas balance and ERC-20 USDC balance.
- Wallet balance and issuer eligibility checks.
- `eth_estimateGas` from the intended payer against actual deployed state.
- Current base fee, priority fee, gas limits and maximum fees.
- Simulation immediately before every signature.

Stop if remaining worst-case gas, locked principal and reserve exceed confirmed
funds. A refund is not spendable until its receipt and balance delta confirm it.
