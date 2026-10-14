# Contracts workspace

This Foundry workspace is configured for Arc's Osaka EVM baseline and Solidity
0.8.37. It contains the non-upgradeable `DueletStream.sol` escrow plus unit,
fuzz, invariant, adversarial-token, and Arc fork tests.

OpenZeppelin Contracts 5.6.1 provides `SafeERC20`, `Math.mulDiv`, and
`ReentrancyGuard`. Forge Standard Library 1.11.0 is vendored for tests under its
MIT/Apache-2.0 dual license. There is no proxy, owner, rescue, or broadcast
script.
