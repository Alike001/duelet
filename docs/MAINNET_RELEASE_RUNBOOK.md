# Duelet Arc mainnet release runbook

Status: prepared, not executed. Every signing or broadcasting step requires
fresh explicit approval.

## Frozen release identity

| Property                   | Value                                                                |
| -------------------------- | -------------------------------------------------------------------- |
| Chain                      | Arc mainnet (`5042`)                                                 |
| RPC                        | `https://rpc.mainnet.arc.io`                                         |
| Explorer                   | `https://explorer.arc.io`                                            |
| Constructor token          | `0x3600000000000000000000000000000000000000`                         |
| Compiler                   | Solidity `0.8.37`, optimizer 200, Osaka                              |
| Runtime size               | 6,216 bytes                                                          |
| Initcode size              | 6,603 bytes                                                          |
| Deployment input size      | 6,635 bytes                                                          |
| Expected runtime code hash | `0xf4ad4b494fd7d609868ae5737d5840ee903b001767718cba4f249309ff84606f` |
| Constructor ABI encoding   | `0x0000000000000000000000003600000000000000000000000000000000000000` |

The runtime hash is for the Arc Foundry build with the USDC immutable patched
into deployed bytecode. Rebuild and compare immediately before deployment.

## Preflight — no signing

1. Check out the approved release commit and require a clean tree.
2. Run `npm ci`, the complete quality gate and the pinned Arc fork suite.
3. Rebuild with `npm run build:arc --workspace @duelet/contracts` and record
   the bytecode sizes/hash. Do not derive the release hash from an upstream
   Foundry artifact; Arc Foundry emits different metadata and execution-target
   bytecode.
4. Read chain ID, gas price, base fee, priority fee and latest block.
5. Identify distinct payer/deployer and payee public addresses. Do not place
   secrets in shell history, environment examples, source or chat.
6. Read payer balance and nonce. Fill every `PENDING` field in the budget.
7. Generate deployment input from `DueletStream` creation bytecode plus the
   exact constructor encoding above.
8. Run `eth_estimateGas` with the intended payer address. Reject any plan above
   the remaining one-USDC cap.

The repository provides `contracts/script/DeployDuelet.s.sol`. It refuses a
non-5042 chain and embeds no signer. Prefer a connected hardware/browser wallet
or an approved keystore flow; never paste a private key into a command.

## Deployment approval checkpoint

Present chain, sender, nonce, input hash, constructor argument, estimated gas,
gas limit, max fee, maximum cost and resulting address. Stop for approval.
Only after approval may the deployment be signed and broadcast.

## Post-deployment verification

Before any invoice write:

1. Require a successful deployment receipt and record transaction hash/block.
2. Read code at the deployed address and require the expected runtime hash.
3. Read `USDC()` and require official Arc USDC.
4. Read `ARC_MAINNET_CHAIN_ID()`, `ARC_MAINNET_USDC()` and
   `INVOICE_ID_DOMAIN()`.
5. Confirm `totalOutstandingLiability() == 0` and `isSolvent() == true`.
6. Verify source/compiler settings and constructor arguments using the Arc
   explorer's supported verification route. Verification must not require a
   paid transaction.
7. Set the actual contract address and deployment block in hosting environment
   variables. The frontend independently repeats the runtime/immutable checks;
   mismatches keep writes locked.

## Canary lifecycle

Use separate payer and payee addresses and a **300-second** schedule. This gives
enough time for receipt inspection and a visible partial claim without claiming
that a transaction will land at an exact second.

For every numbered write: refresh state/fees, simulate, compare the remaining
budget, show the transaction preview, and obtain approval.

1. Approve exactly `10,000` ERC-20 base units.
2. Create and fund the invoice with 0.010000 USDC and non-sensitive hashes.
3. Confirm deposit, emitted event, invoice fields and aggregate liability.
4. After observable partial vesting, have the payer permissionlessly trigger
   `withdraw(invoiceId)`; require the immutable payee balance increase.
5. Before maturity, simulate cancellation, display earned/unvested values, then
   call `cancel` from the payer.
6. Confirm payer refund and frozen vested entitlement.
7. From the gas-funded payer, trigger the payee's final claim.
8. Require exact balance reconciliation, zero invoice liability and aggregate
   solvency. Do not intentionally send a reverting transaction.
9. Publish only confirmed transaction hashes and block timestamps.

If the stream matures before cancellation, do not fake the intended path. Mark
that canary completed without cancellation and request approval for a new one.

## Frontend and hosting

Create a free Vercel project only through an authorized account. Use the
repository root, npm install command `npm ci`, and build command
`npm run build --workspace @duelet/web`. Configure:

```text
NEXT_PUBLIC_ARC_RPC_URL=https://rpc.mainnet.arc.io
NEXT_PUBLIC_ARC_EXPLORER_URL=https://explorer.arc.io
NEXT_PUBLIC_DUELET_CONTRACT_ADDRESS=<confirmed address>
NEXT_PUBLIC_DUELET_DEPLOYMENT_BLOCK=<confirmed block>
NEXT_PUBLIC_REOWN_PROJECT_ID=<optional; does not enable AppKit by itself>
```

These are public values, not secrets. Do not configure a private key. First
deploy the site without address/block to verify preview mode; after contract
verification, add both values and repeat production browser tests and hard
refreshes for `/invoices/<id>` and `/proof/<id>`.

Source verification is a separate post-deployment gate. Follow
`docs/BLOCKSCOUT_VERIFICATION.md`; do not guess a verifier API URL or describe a
manual evidence bundle as explorer verification.

## Rollback and stop conditions

- Frontend: remove either deployment variable and redeploy to restore preview
  mode and lock writes.
- Contract: immutable and non-upgradeable; there is no admin rollback. Stop new
  use, preserve direct claim/cancel instructions and publish the limitation.
- Stop for any bytecode/config mismatch, failed simulation, issuer restriction,
  RPC disagreement, balance shortfall, unexpected nonce, fee above ceiling or
  unresolved critical/high finding.
