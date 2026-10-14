# Duelet Blockscout source-verification procedure

Status: prepared, not executed. Duelet has no deployed contract address yet,
so source verification cannot be claimed.

## Frozen compilation identity

| Property                   | Release value                                                        |
| -------------------------- | -------------------------------------------------------------------- |
| Contract                   | `contracts/src/DueletStream.sol:DueletStream`                        |
| Compiler                   | Solidity `0.8.37`                                                    |
| EVM target                 | Osaka                                                                |
| Optimizer                  | enabled, 200 runs                                                    |
| Metadata                   | CBOR enabled, IPFS bytecode hash                                     |
| Constructor type           | `address`                                                            |
| Constructor value          | `0x3600000000000000000000000000000000000000`                         |
| Constructor ABI encoding   | `0x0000000000000000000000003600000000000000000000000000000000000000` |
| Expected Arc runtime size  | 6,216 bytes                                                          |
| Expected Arc initcode size | 6,603 bytes                                                          |
| Expected runtime code hash | `0xf4ad4b494fd7d609868ae5737d5840ee903b001767718cba4f249309ff84606f` |

These values are derived from the Arc Foundry build profile in
`contracts/foundry.toml`. Rebuild them from the approved release commit
immediately before deployment. The constructor encoding can be reproduced
without a wallet:

```bash
arc-cast abi-encode 'constructor(address)' \
  0x3600000000000000000000000000000000000000
```

## Reproducible verification bundle

Run `npm run release:verification-bundle` from the repository root. The
checked-in bundle at `artifacts/blockscout/` contains:

- exact Standard JSON compiler input with all source contents;
- constructor ABI encoding;
- creation bytecode and complete deployment input;
- constructor-patched expected runtime bytecode; and
- a machine-readable size and hash manifest.

The prepared manifest commits to creation bytecode hash
`0x12947aaa71d70faca733cc0a04a7f1a1c2f07df782f22e1f7cf89ec1239f99e2`,
complete deployment-input hash
`0xb367394f497b3c3b939cde50b967e81e190a5ea8a96c5af07233adde4c87eba8`,
and expected Arc runtime hash
`0xf4ad4b494fd7d609868ae5737d5840ee903b001767718cba4f249309ff84606f`.
Regenerate and compare the bundle from the final merged commit before signing.

## Preferred Blockscout submission

Arc's explorer is a Blockscout deployment at <https://explorer.arc.io/>. After
a confirmed deployment and the independent bytecode/immutable checks in the
mainnet runbook:

1. Open the deployed contract address in the explorer and choose **Verify &
   publish**.
2. Prefer Standard JSON verification so every imported OpenZeppelin source,
   remapping, optimizer setting, EVM target, and metadata setting is explicit.
3. Use `artifacts/blockscout/standard-input.json` regenerated from the exact
   clean release checkout. Do not edit flattened source to make it pass.
4. Select Solidity `0.8.37`, optimizer enabled with `200` runs, and Osaka.
5. Supply the constructor ABI encoding above without a second `0x` prefix if
   the form adds one.
6. Submit only after the address's creation input matches the locally prepared
   creation bytecode plus constructor encoding.
7. Require the explorer to show verified source for `DueletStream`, its MIT
   SPDX identifier, and imported dependency source/notices.

An authenticated explorer API probe returned HTTP 403 from this environment,
so the exact mainnet API endpoint is not asserted here. The visible mainnet
Blockscout UI is available and reports verified contracts. At deployment time,
inspect its current API documentation rather than assuming the testnet path is
identical.

If the mainnet explorer exposes the standard Blockscout verifier endpoint, the
candidate Foundry shape is:

```bash
arc-forge verify-contract \
  <DEPLOYED_ADDRESS> \
  src/DueletStream.sol:DueletStream \
  --chain 5042 \
  --verifier blockscout \
  --verifier-url <CONFIRMED_MAINNET_API_URL> \
  --constructor-args \
  0x0000000000000000000000003600000000000000000000000000000000000000 \
  --watch
```

Do not run this command with a guessed verifier URL. Source verification should
not require a paid onchain transaction.

## Acceptance evidence

Record all of the following:

- deployment transaction hash, receipt status, address, and block;
- full deployment input hash and constructor argument;
- local build commit and `foundry.toml` settings;
- onchain runtime bytecode and `keccak256` code hash;
- read-back of `USDC()`, chain constants, domain constant, zero liability, and
  solvency;
- the public explorer URL showing successful source verification;
- compiler/settings/dependency list shown by Blockscout;
- a screenshot and timestamp of the verified contract page.

Verification is failed if the explorer accepts source that does not reproduce
the onchain runtime, if constructor arguments differ, or if any immutable
read-back differs. Keep the frontend in preview mode on failure.

## Manual fallback

If Blockscout verification is unavailable, publish the immutable release
evidence without claiming explorer verification: exact Git commit, Standard
JSON input, compiler version, settings, creation bytecode hash, constructor
encoding, deployed runtime bytes/hash, and read-back calls. Reviewers can
rebuild and compare independently. The application must label explorer source
verification as unavailable and continue to lock writes until the existing
runtime/USDC identity checks pass. A manual evidence bundle is useful proof,
but it is not equivalent to a Blockscout “verified” badge.
