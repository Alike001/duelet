export const ARC_MAINNET = {
  chainId: 5042,
  explorerUrl: 'https://explorer.arc.io',
  rpcUrl: 'https://rpc.mainnet.arc.io',
  usdcAddress: '0x3600000000000000000000000000000000000000',
  usdcDecimals: 6,
} as const;

export const PRODUCT = {
  name: 'Duelet',
  tagline: 'Invoice once. Pay over time.',
  description: 'Invoice-linked USDC streaming escrow on Arc.',
} as const;

export const PHASE = 'smart-contract-implemented' as const;
