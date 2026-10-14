# Duelet mainnet canary budget

Status: planned only; no transaction is authorized or broadcast.

Total available funding: **1.000000 USDC**, including the incoming funding
transaction, gas and 0.010000 USDC principal.

Observed October 14, 2026 near block `25948073`:

- `eth_gasPrice`: 20,000,000,000 wei/gas (20 gwei)
- `eth_maxPriorityFeePerGas`: 0
- latest base fee: 20,000,000,000 wei/gas

The ceiling uses **25 gwei**, 25% above observation. Refresh every value before
signing; this is a maximum planning parameter, not a price prediction.

| Transaction           | Expected nonce |  Estimate |     Gas limit | Max fee |        Worst case |
| --------------------- | -------------- | --------: | ------------: | ------: | ----------------: |
| Friend funds payer    | sender pending |    21,000 |        30,000 | 25 gwei |     0.000750 USDC |
| Deploy Duelet         | payer `N`      | 1,436,821 |     1,600,000 | 25 gwei |     0.040000 USDC |
| Approve 0.010000      | payer `N+1`    |    56,229 |        70,000 | 25 gwei |     0.001750 USDC |
| Create and fund       | payer `N+2`    |   194,816 |       240,000 | 25 gwei |     0.006000 USDC |
| Partial withdrawal    | payer `N+3`    |    78,049 |       100,000 | 25 gwei |     0.002500 USDC |
| Cancel/refund         | payer `N+4`    |    74,517 |        95,000 | 25 gwei |     0.002375 USDC |
| Final withdrawal      | payer `N+5`    |    28,801 |        45,000 | 25 gwei |     0.001125 USDC |
| **Total gas ceiling** |                |           | **2,180,000** |         | **0.054500 USDC** |

If the friend starts with exactly 1 USDC, the payer can receive at most
0.999250 USDC after the sender's worst-case fee.

| Allocation                 |         USDC |
| -------------------------- | -----------: |
| Worst-case cumulative gas  |     0.054500 |
| Stream principal           |     0.010000 |
| Uncommitted safety reserve |     0.935500 |
| **Total**                  | **1.000000** |

| Balance checkpoint              | Minimum payer balance |
| ------------------------------- | --------------------: |
| Incoming funding confirmed      |              0.999250 |
| Deployment                      |              0.959250 |
| Approval                        |              0.957500 |
| Funding plus locked principal   |              0.941500 |
| Partial withdrawal gas          |              0.939000 |
| Cancellation gas, before refund |              0.936625 |
| Final claim gas, before refund  |              0.935500 |

The payer later receives the confirmed unvested refund; the payee receives
vested claims. Across payer, payee and escrow, remaining value equals one USDC
minus actual gas.

## Pending wallet-specific evidence

- Payer/payee addresses and starting nonces.
- Confirmed incoming amount after sender fee.
- Wallet balance and issuer eligibility checks.
- `eth_estimateGas` from the intended payer against actual deployed state.
- Current base fee, priority fee, gas limits and maximum fees.
- Simulation immediately before every signature.

Stop if remaining worst-case gas, locked principal and reserve exceed confirmed
funds. A refund is not spendable until its receipt and balance delta confirm it.
