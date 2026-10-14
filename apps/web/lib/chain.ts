import { defineChain } from 'viem';

export const ARC_CHAIN_ID = 5042;
export const ARC_RPC_URL =
  process.env.NEXT_PUBLIC_ARC_RPC_URL ?? 'https://rpc.mainnet.arc.io';
export const ARC_EXPLORER_URL =
  process.env.NEXT_PUBLIC_ARC_EXPLORER_URL ?? 'https://explorer.arc.io';
export const ARC_USDC_ADDRESS =
  '0x3600000000000000000000000000000000000000' as const;

export const arc = defineChain({
  id: ARC_CHAIN_ID,
  name: 'Arc Mainnet',
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
  rpcUrls: { default: { http: [ARC_RPC_URL] } },
  blockExplorers: { default: { name: 'Arc Explorer', url: ARC_EXPLORER_URL } },
});

const configuredAddress = process.env.NEXT_PUBLIC_DUELET_CONTRACT_ADDRESS;
const configuredBlock = process.env.NEXT_PUBLIC_DUELET_DEPLOYMENT_BLOCK;
const verifiedAddress =
  configuredAddress && /^0x[a-fA-F0-9]{40}$/.test(configuredAddress)
    ? (configuredAddress as `0x${string}`)
    : undefined;
const verifiedBlock =
  configuredBlock && /^\d+$/.test(configuredBlock)
    ? BigInt(configuredBlock)
    : undefined;

export const deployment = {
  address: verifiedAddress,
  block: verifiedBlock,
  mode:
    verifiedAddress && verifiedBlock
      ? ('deployed' as const)
      : ('preview' as const),
};

export const txUrl = (hash: string) => `${ARC_EXPLORER_URL}/tx/${hash}`;
export const addressUrl = (address: string) =>
  `${ARC_EXPLORER_URL}/address/${address}`;
