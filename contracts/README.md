# Contracts workspace

This Foundry workspace is configured for Arc's Osaka EVM baseline and Solidity
0.8.37. The production `ArcInvoiceStream.sol` contract and its tests are a
Phase 1 deliverable and are intentionally absent in Phase 0.

OpenZeppelin Contracts 5.6.1 is pinned for future imports of `SafeERC20`,
`Math.mulDiv`, and `ReentrancyGuard`. No proxy or administrative framework is
planned.
