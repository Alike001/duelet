# Duelet Blockscout verification bundle

Status: **prepared, not deployed, not source-verified**.

Generate this directory from a clean release checkout with:

```bash
npm run release:verification-bundle
```

The bundle contains the exact Standard JSON compiler input, constructor ABI
encoding, creation bytecode, complete deployment input, expected
constructor-patched runtime bytecode, and a hash/size manifest for
`DueletStream`. The runtime expectation binds the immutable token to official
Arc USDC.

After deployment, compare the actual creation input and runtime code byte for
byte before submitting `standard-input.json` and `constructor-args.txt` to the
Arc Blockscout verifier. The presence of this bundle is not evidence that a
deployment or source verification occurred.
