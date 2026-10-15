'use client';

import { keccak256, type Address, type Hex } from 'viem';
import { useBytecode, useReadContract } from 'wagmi';

import { dueletAbi } from './abi';
import {
  ARC_CHAIN_ID,
  ARC_USDC_ADDRESS,
  deployment,
  DUELET_ARC_RUNTIME_CODEHASH,
} from './chain';

export function deploymentIdentityMatches(
  runtimeCodeHash: Hex | undefined,
  token: Address | undefined,
) {
  return (
    runtimeCodeHash?.toLowerCase() ===
      DUELET_ARC_RUNTIME_CODEHASH.toLowerCase() &&
    token?.toLowerCase() === ARC_USDC_ADDRESS.toLowerCase()
  );
}

export function useDeploymentVerification() {
  const configured =
    deployment.mode === 'deployed' && Boolean(deployment.address);
  const bytecode = useBytecode({
    address: deployment.address,
    chainId: ARC_CHAIN_ID,
    query: { enabled: configured, staleTime: Infinity },
  });
  const token = useReadContract({
    address: deployment.address,
    abi: dueletAbi,
    functionName: 'USDC',
    chainId: ARC_CHAIN_ID,
    query: { enabled: configured, staleTime: Infinity },
  });
  const runtimeCodeHash = bytecode.data ? keccak256(bytecode.data) : undefined;
  const verified = deploymentIdentityMatches(runtimeCodeHash, token.data);
  const loading = configured && (bytecode.isPending || token.isPending);

  return {
    configured,
    loading,
    verified,
    runtimeCodeHash,
    retry: () => Promise.all([bytecode.refetch(), token.refetch()]),
    reason: !configured
      ? 'No deployment is configured.'
      : loading
        ? 'Verifying deployed bytecode and immutable USDC configuration.'
        : bytecode.isError || token.isError
          ? 'Arc RPC verification is unavailable. Retry to check the deployed contract; payments remain locked.'
          : verified
            ? undefined
            : 'Configured deployment does not match the approved Duelet bytecode and Arc USDC constructor configuration.',
  };
}
